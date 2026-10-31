import { prisma } from './db';
import {
  listLicensesFromServer,
  addCreditsOnServer,
  createLicenseOnServer,
  generateLicenseKey,
} from './license-server';
import { provision } from './provisioning';
import { sendRechargeEmail } from './email';
import { syncListDeletedStudents, syncListStudents, syncListAffiliates } from './members-sync';
import { FALLBACK_PLANS } from './plans';

/**
 * Sincroniza pagamentos da AbacatePay (v2) diretamente com o banco local e Railway.
 * Funciona de forma resiliente tanto em localhost quanto em ambiente serverless na Vercel!
 */
export async function syncAbacatePay(): Promise<{ synced: number; processed: string[] }> {
  const apiKey = process.env.ABACATEPAY_API_KEY?.trim();
  if (!apiKey) throw new Error('ABACATEPAY_API_KEY não configurada');
  if (!apiKey) return { synced: 0, processed: [] };

  try {
    const res = await fetch('https://api.abacatepay.com/v2/checkouts/list', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`AbacatePay HTTP ${res.status}: ${errText}`);
    }

    const json = await res.json();
    const checkouts = json.data || [];

    const processed: string[] = [];
    const failedCheckouts: string[] = [];
    const debugInfo: any[] = [];
    const [railwayLicenses, deletedInfo, hostgatorStudents, hostgatorAffiliates, lastClearLog, deletedLogs] = await Promise.all([
      listLicensesFromServer().catch(() => []),
      syncListDeletedStudents().catch(() => ({ deleted: [], deletedCheckouts: [], clearedAt: null })),
      syncListStudents().catch(() => []),
      syncListAffiliates().catch(() => []),
      prisma.auditLog.findFirst({
        where: { eventType: 'crm_cleared' },
        orderBy: { createdAt: 'desc' },
      }).catch(() => null),
      prisma.auditLog.findMany({
        where: { eventType: 'customer_deleted' },
        select: { message: true, createdAt: true },
      }).catch(() => []),
    ]);

    // ── 0A. Hidrata afiliados da HostGator no banco local se necessário ──
    if (Array.isArray(hostgatorAffiliates) && hostgatorAffiliates.length > 0) {
      for (const hg of hostgatorAffiliates) {
        if (!hg.email || !hg.slug) continue;
        await prisma.affiliate.upsert({
          where: { email: hg.email },
          update: {
            name: hg.name,
            slug: hg.slug,
            token: hg.token,
            couponCode: hg.couponCode,
            discountPercent: hg.discountPercent,
            commissionPercent: hg.commissionPercent,
            pixKey: hg.pixKey,
            pixKeyType: hg.pixKeyType,
            active: hg.active !== false,
            notes: hg.notes,
          },
          create: {
            id: hg.id || undefined,
            name: hg.name,
            email: hg.email,
            slug: hg.slug,
            token: hg.token || undefined,
            couponCode: hg.couponCode,
            discountPercent: hg.discountPercent,
            commissionPercent: hg.commissionPercent,
            pixKey: hg.pixKey,
            pixKeyType: hg.pixKeyType,
            active: hg.active !== false,
            notes: hg.notes,
          },
        }).catch(() => null);
      }
    }

    let clearedAt: Date | null = null;
    if (deletedInfo.clearedAt) {
      clearedAt = new Date(deletedInfo.clearedAt);
    }
    if (lastClearLog?.createdAt) {
      const localCleared = new Date(lastClearLog.createdAt);
      if (!clearedAt || localCleared > clearedAt) {
        clearedAt = localCleared;
      }
    }

    const deletedCheckoutsSet = new Set<string>(deletedInfo.deletedCheckouts || []);

    // ── 0. Purga registros do banco local que foram excluídos ou limpos em outros containers / HostGator ──
    if (clearedAt) {
      try {
        await prisma.accessCredentials.deleteMany({ where: { createdAt: { lte: clearedAt } } }).catch(() => null);
        await prisma.subscription.deleteMany({ where: { createdAt: { lte: clearedAt } } }).catch(() => null);
        await prisma.order.deleteMany({ where: { createdAt: { lte: clearedAt } } }).catch(() => null);
        await prisma.customer.deleteMany({ where: { createdAt: { lte: clearedAt } } }).catch(() => null);
      } catch (purgeErr) {
        console.warn('[Sync AbacatePay] Erro ao limpar histórico local de clearedAt:', purgeErr);
      }
    }

    if (deletedCheckoutsSet.size > 0) {
      try {
        const checkoutsArr = Array.from(deletedCheckoutsSet);
        await prisma.accessCredentials.deleteMany({
          where: { order: { abacateCheckoutId: { in: checkoutsArr } } },
        }).catch(() => null);
        await prisma.order.deleteMany({
          where: { abacateCheckoutId: { in: checkoutsArr } },
        }).catch(() => null);
      } catch (chkErr) {
        console.warn('[Sync AbacatePay] Erro ao purgar checkouts excluídos do banco local:', chkErr);
      }
    }

    for (const c of checkouts) {
      if (c.status !== 'PAID') continue;

      // 0. Se o checkout específico foi excluído individualmente pelo admin, ignora
      if (deletedCheckoutsSet.has(c.id)) {
        continue;
      }

      const meta = c.metadata || {};
      const customerEmail = (meta.email || '').toLowerCase().trim();
      if (!customerEmail) continue;

      const checkoutDate = new Date(c.createdAt || Date.now());

      // 1. Ignora histórico antigo de checkouts de teste (anteriores a 30/10/2026 18:00 UTC) ou da limpeza do CRM
      const CUTOFF_DATE = new Date('2026-10-30T18:00:00.000Z');
      if (checkoutDate < CUTOFF_DATE || (clearedAt && checkoutDate <= clearedAt)) {
        continue;
      }



      try {
        let order: any = null;
        try {
          order = await prisma.order.findFirst({
            where: {
              OR: [
                { abacateCheckoutId: c.id },
                ...(meta.orderId ? [{ id: meta.orderId }] : []),
              ],
            },
            include: { customer: true, plan: true },
          });
        } catch (err) {
          console.warn('[Sync AbacatePay] Prisma indisponível para consulta de pedido:', err);
        }

        const isRecharge = meta.isRecharge === true || meta.isRecharge === 'true';
        if (order && order.status === 'paid' && !isRecharge) {
          const fulfilled = await prisma.accessCredentials.findFirst({
            where: { orderId: order.id, status: 'active' },
            select: { id: true },
          });
          if (fulfilled) {
            processed.push(c.id);
            continue;
          }
        }

        const planSlug = meta.slug || 'pack_criador';
        const fallbackPlan = FALLBACK_PLANS.find((p) => p.slug === planSlug) || FALLBACK_PLANS[0];

        // 1. Garante que o Plan existe no banco de dados local
        let dbPlan = await prisma.plan.findUnique({ where: { slug: planSlug } }).catch(() => null);
        if (!dbPlan) {
          dbPlan = await prisma.plan.upsert({
            where: { slug: fallbackPlan.slug },
            update: {},
            create: {
              id: fallbackPlan.id,
              name: fallbackPlan.name,
              slug: fallbackPlan.slug,
              price: fallbackPlan.price,
              currency: 'BRL',
              interval: fallbackPlan.interval,
              features: fallbackPlan.features as any,
              active: true,
            },
          }).catch(() => null);
        }

        // 2. Garante que o Customer existe no banco de dados local
        let customer = await prisma.customer.findUnique({ where: { email: customerEmail } }).catch(() => null);
        if (!customer) {
          const hgStudent = hostgatorStudents.find((s: any) => s.email?.toLowerCase() === customerEmail);
          const customerName = meta.name || hgStudent?.nome || customerEmail.split('@')[0];
          customer = await prisma.customer.create({
            data: {
              name: customerName,
              email: customerEmail,
              phone: meta.phone || null,
            },
          });
        }

        // 3. Garante que o Order existe e está marcado como 'paid'
        const paidDate = new Date(c.updatedAt || c.createdAt || Date.now());
        const orderAmount = Number(c.amount || c.paidAmount || dbPlan?.price || 8690);

        // Identificação e atribuição de Parceiro / YouTuber / Cupom
        let affiliateId = meta.affiliateId || null;
        let couponCode = meta.couponCode ? String(meta.couponCode).trim().toUpperCase() : null;
        let commissionAmount = meta.commissionAmount ? Number(meta.commissionAmount) : null;
        let commissionStatus: string | null = null;

        if (!affiliateId && (couponCode || meta.affiliateSlug)) {
          const aff = await prisma.affiliate.findFirst({
            where: {
              active: true,
              OR: [
                ...(couponCode ? [{ couponCode }] : []),
                ...(meta.affiliateSlug ? [{ slug: String(meta.affiliateSlug).toLowerCase().trim() }] : []),
              ],
            },
          }).catch(() => null);

          if (aff) {
            affiliateId = aff.id;
            couponCode = aff.couponCode;
            if (!commissionAmount && aff.commissionPercent > 0) {
              commissionAmount = Math.round((orderAmount * aff.commissionPercent) / 100);
            }
          }
        }

        if (affiliateId) {
          commissionStatus = 'credited';
          if (!commissionAmount) {
            commissionAmount = Math.round((orderAmount * 20) / 100);
          }
        }

        if (!order) {
          order = await prisma.order.create({
            data: {
              id: meta.orderId || `ord_${c.id}`,
              customerId: customer.id,
              planId: dbPlan?.id || fallbackPlan.id,
              status: 'paid',
              amount: orderAmount,
              currency: 'BRL',
              abacateCheckoutId: c.id,
              paidAt: paidDate,
              createdAt: new Date(c.createdAt || Date.now()),
              affiliateId,
              couponCode,
              commissionAmount,
              commissionStatus,
              metadata: meta,
            },
            include: { customer: true, plan: true },
          });
        } else {
          order = await prisma.order.update({
            where: { id: order.id },
            data: {
              status: 'paid',
              paidAt: paidDate,
              affiliateId: order.affiliateId || affiliateId,
              couponCode: order.couponCode || couponCode,
              commissionAmount: order.commissionAmount || commissionAmount,
              commissionStatus: (order.affiliateId || affiliateId) ? 'credited' : order.commissionStatus,
            },
            include: { customer: true, plan: true },
          });
        }

        if (isRecharge && meta.licenseKey && meta.creditsToAdd) {
          const credits = Number(meta.creditsToAdd);
          const key = String(meta.licenseKey).trim();
          const existsOnRailway = railwayLicenses.some(
            (l) => l.license_key.toUpperCase() === key.toUpperCase()
          );
          let creditsAfter = credits;

          if (existsOnRailway) {
            const creditResult = await addCreditsOnServer(key, credits, `recharge:${order.id}`);
            if (!creditResult.ok) throw new Error(creditResult.message || 'Falha ao adicionar créditos no Railway');
            if (creditResult.credits === undefined) throw new Error('Railway não retornou saldo após recarga');
            creditsAfter = creditResult.credits;
            await prisma.accessCredentials.updateMany({
              where: { licenseKey: key },
              data: { credits: creditsAfter },
            });
          } else {
            const created = await createLicenseOnServer({
              licenseKey: key,
              credits: 0,
              days: 365,
              plan: meta.packageSlug || 'recarga',
              operationId: `recharge-create:${order.id}`,
            });
            if (!created.ok) throw new Error(created.message || 'Falha ao criar licença no Railway');
            const creditResult = await addCreditsOnServer(key, credits, `recharge:${order.id}`);
            if (!creditResult.ok || creditResult.credits === undefined) {
              throw new Error(creditResult.message || 'Falha ao lançar os créditos da recarga no Railway');
            }
            creditsAfter = creditResult.credits;
          }

          // Atualiza ou cria a credencial no banco local
          await prisma.accessCredentials.upsert({
            where: { id: `cred_${order.id}` },
            update: {
              credits: creditsAfter,
              licenseKey: key,
              status: 'active',
            },
            create: {
              id: `cred_${order.id}`,
              customerId: customer.id,
              orderId: order.id,
              username: customerEmail.split('@')[0],
              accessUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://fabricadecortes.com'}/retorno`,
              licenseKey: key,
              credits,
              status: 'active',
              expiresAt: new Date(Date.now() + 365 * 86400000),
            },
          });

          const emailResult = await sendRechargeEmail({
            to: customerEmail,
            name: customer.name,
            licenseKey: key,
            creditsAdded: credits,
          });
          if (!emailResult.ok) throw new Error(emailResult.error || 'Falha ao enviar e-mail da recarga');
        } else if (!isRecharge) {
          // Compra de plano novo: verifica se já tem credencial ativa para este pedido
          const cred = await prisma.accessCredentials.findFirst({
            where: { orderId: order.id },
          });

          const hgStudent = hostgatorStudents.find((s: any) => s.email?.toLowerCase() === customerEmail);
          if (cred) {
            if (hgStudent?.nome && customer.name !== hgStudent.nome) {
              await prisma.customer.update({
                where: { id: customer.id },
                data: { name: hgStudent.nome },
              }).catch(() => null);
            }
          } else {
            // Localiza se já existe chave do Railway vinculada ou gerada para este plano
            const allCreds = await prisma.accessCredentials.findMany({ select: { licenseKey: true } }).catch(() => []);
            const assignedKeys = allCreds.map((k) => k.licenseKey);
            const matchingLic = railwayLicenses.find(
              (l) => l.plan === planSlug && l.status === 'active' && !assignedKeys.includes(l.license_key)
            );

            const chosenKey = matchingLic ? matchingLic.license_key : undefined;

            let subscription = await prisma.subscription.findFirst({
              where: { customerId: customer.id, planId: order.planId, status: 'active' },
            }).catch(() => null);

            if (!subscription) {
              subscription = await prisma.subscription.create({
                data: {
                  customerId: customer.id,
                  planId: order.planId,
                  status: 'active',
                  provider: 'AbacatePay',
                  orderId: order.id,
                },
              });
            }

            await provision({
              customerId: customer.id,
              orderId: order.id,
              subscriptionId: subscription.id,
              email: customerEmail,
              plan: planSlug,
              licenseKey: chosenKey,
              includeCourse: meta.includeCourse === 'true' || meta.includeCourse === true,
              skipEmail: false,
            });
          }
        }

        processed.push(c.id);
      } catch (itemErr: any) {
        console.error(`[Sync AbacatePay] Falha ao processar checkout ${c.id}:`, itemErr?.message);
        failedCheckouts.push(String(c.id));
      }
    }

    if (failedCheckouts.length) {
      throw new Error(`Falha ao processar ${failedCheckouts.length} checkout(s): ${failedCheckouts.join(', ')}`);
    }

    // ── 4. Sincroniza senhas e nomes de todos os alunos da Área de Membros no banco local ──
    if (Array.isArray(hostgatorStudents) && hostgatorStudents.length > 0) {
      for (const st of hostgatorStudents) {
        const stEmail = (st.email || '').toLowerCase().trim();
        if (!stEmail) continue;

        try {
          const cust = await prisma.customer.findUnique({
            where: { email: stEmail },
            include: { credentials: true },
          }).catch(() => null);

          if (cust) {
            if (st.nome && cust.name !== st.nome) {
              await prisma.customer.update({
                where: { id: cust.id },
                data: { name: st.nome },
              }).catch(() => null);
            }
          }
        } catch {}
      }
    }

    return {
      synced: processed.length,
      processed,
      totalCheckouts: checkouts.length,
      deletedEmails: [],
      railwayLicensesCount: railwayLicenses.length,
    } as any;
  } catch (err: any) {
    console.error('[Sync AbacatePay] Erro geral ao sincronizar:', err?.message);
    return { synced: 0, processed: [], error: err?.message || String(err) } as any;
  }
}
