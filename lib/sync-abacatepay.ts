import { prisma } from './db';
import {
  listLicensesFromServer,
  addCreditsOnServer,
  createLicenseOnServer,
  generateLicenseKey,
} from './license-server';
import { provision } from './provisioning';
import { sendRechargeEmail } from './email';
import { syncListDeletedStudents, syncListStudents } from './members-sync';
import { FALLBACK_PLANS } from './plans';

/**
 * Sincroniza pagamentos da AbacatePay (v2) diretamente com o banco local e Railway.
 * Funciona de forma resiliente tanto em localhost quanto em ambiente serverless na Vercel!
 */
export async function syncAbacatePay(): Promise<{ synced: number; processed: string[] }> {
  const apiKey = process.env.ABACATEPAY_API_KEY || 'abc_dev_zWzyHEKWK5cX6gZf63HUWpZy';
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
      return { synced: 0, processed: [], error: `AbacatePay HTTP ${res.status}: ${errText}` } as any;
    }

    const json = await res.json();
    const checkouts = json.data || [];

    const processed: string[] = [];
    const debugInfo: any[] = [];
    const [railwayLicenses, deletedInfo, hostgatorStudents, lastClearLog, deletedLogs] = await Promise.all([
      listLicensesFromServer().catch(() => []),
      syncListDeletedStudents().catch(() => ({ deleted: [], clearedAt: null })),
      syncListStudents().catch(() => []),
      prisma.auditLog.findFirst({
        where: { eventType: 'crm_cleared' },
        orderBy: { createdAt: 'desc' },
      }).catch(() => null),
      prisma.auditLog.findMany({
        where: { eventType: 'customer_deleted' },
        select: { message: true, createdAt: true },
      }).catch(() => []),
    ]);

    const deletedAtMap = new Map<string, Date>();
    if (Array.isArray(deletedInfo.deleted)) {
      for (const item of deletedInfo.deleted) {
        if (item.email) {
          const dt = item.excluido_em ? new Date(item.excluido_em) : new Date(0);
          deletedAtMap.set(item.email, dt);
        }
      }
    }
    if (Array.isArray(deletedLogs)) {
      for (const log of deletedLogs) {
        const email = (log.message || '').toLowerCase().trim();
        if (email && log.createdAt) {
          const existing = deletedAtMap.get(email);
          if (!existing || new Date(log.createdAt) > existing) {
            deletedAtMap.set(email, new Date(log.createdAt));
          }
        }
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

    if (deletedAtMap.size > 0) {
      try {
        for (const [delEmail, delTime] of deletedAtMap.entries()) {
          const cust = await prisma.customer.findFirst({
            where: { email: delEmail },
            include: { orders: true },
          }).catch(() => null);
          if (cust) {
            const hasNewerOrder = cust.orders.some((o) => new Date(o.createdAt) > delTime);
            if (!hasNewerOrder) {
              await prisma.accessCredentials.deleteMany({ where: { customerId: cust.id } }).catch(() => null);
              await prisma.subscription.deleteMany({ where: { customerId: cust.id } }).catch(() => null);
              await prisma.order.deleteMany({ where: { customerId: cust.id } }).catch(() => null);
              await prisma.customer.delete({ where: { id: cust.id } }).catch(() => null);
            }
          }
        }
      } catch (delPurgeErr) {
        console.warn('[Sync AbacatePay] Erro ao purgar clientes excluídos:', delPurgeErr);
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

      // 1. Se o checkout ocorreu antes da limpeza total do CRM, ignora histórico antigo
      if (clearedAt && checkoutDate <= clearedAt) {
        continue;
      }

      // 2. Se o cliente foi excluído após esta compra, ignora histórico anterior
      const deletedAt = deletedAtMap.get(customerEmail);
      if (deletedAt && checkoutDate <= deletedAt) {
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

        // Se o pedido já existe e está pago, não precisa reprocessar
        if (order && order.status === 'paid') {
          processed.push(c.id);
          continue;
        }

        const isRecharge = meta.isRecharge === true || meta.isRecharge === 'true';
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

          if (existsOnRailway) {
            await addCreditsOnServer(key, credits);
          } else {
            await createLicenseOnServer({
              licenseKey: key,
              credits,
              days: 365,
              plan: meta.packageSlug || 'recarga',
            });
          }

          // Atualiza ou cria a credencial no banco local
          await prisma.accessCredentials.upsert({
            where: { id: `cred_${order.id}` },
            update: {
              credits: { increment: credits },
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

          await sendRechargeEmail({
            to: customerEmail,
            name: customer.name,
            licenseKey: key,
            creditsAdded: credits,
          }).catch((err) => console.error('[Sync AbacatePay] Falha ao enviar e-mail de recarga:', err));
        } else if (!isRecharge) {
          // Compra de plano novo: verifica se já tem credencial ativa
          let cred = await prisma.accessCredentials.findFirst({
            where: { customerId: customer.id },
          });

          const hgStudent = hostgatorStudents.find((s: any) => s.email?.toLowerCase() === customerEmail);

          if (cred) {
            // Sincroniza senha atualizada da Área de Membros para a credencial local existente
            if (hgStudent?.senha_plana && cred.plainPassword !== hgStudent.senha_plana) {
              await prisma.accessCredentials.updateMany({
                where: { customerId: customer.id },
                data: { plainPassword: hgStudent.senha_plana },
              }).catch(() => null);
            }
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

            const studentPassword = hgStudent?.senha_plana || meta.password || undefined;
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
              password: studentPassword,
              includeCourse: meta.includeCourse === 'true' || meta.includeCourse === true,
              skipEmail: Boolean(hgStudent),
            });
          }
        }

        processed.push(c.id);
      } catch (itemErr: any) {
        console.error(`[Sync AbacatePay] Falha ao processar checkout ${c.id}:`, itemErr?.message);
      }
    }

    // ── 4. Sincroniza senhas e nomes de todos os alunos da Área de Membros no banco local ──
    if (Array.isArray(hostgatorStudents) && hostgatorStudents.length > 0) {
      for (const st of hostgatorStudents) {
        const stEmail = (st.email || '').toLowerCase().trim();
        if (!stEmail || deletedAtMap.has(stEmail)) continue;

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
            if (st.senha_plana && cust.credentials.length > 0) {
              const diff = cust.credentials.some((cr) => cr.plainPassword !== st.senha_plana);
              if (diff) {
                await prisma.accessCredentials.updateMany({
                  where: { customerId: cust.id },
                  data: { plainPassword: st.senha_plana },
                }).catch(() => null);
              }
            }
          }
        } catch {}
      }
    }

    return {
      synced: processed.length,
      processed,
      totalCheckouts: checkouts.length,
      deletedEmails: Array.from(deletedAtMap.keys()),
      railwayLicensesCount: railwayLicenses.length,
    } as any;
  } catch (err: any) {
    console.error('[Sync AbacatePay] Erro geral ao sincronizar:', err?.message);
    return { synced: 0, processed: [], error: err?.message || String(err) } as any;
  }
}
