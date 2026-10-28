// GET /api/access/find — busca credenciais ativas do cliente por e-mail ou orderId
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { colabUrl, driveUrl, whatsappUrl } from '@/lib/provisioning';
import { listLicensesFromServer, createLicenseOnServer } from '@/lib/license-server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = (searchParams.get('email') || '').trim().toLowerCase();
    const orderId = (searchParams.get('orderId') || '').trim();

    if (!email && !orderId) {
      return NextResponse.json({ error: 'Informe seu e-mail ou o ID do pedido.' }, { status: 400 });
    }

    // 1. Tenta buscar no banco de dados Prisma local (caso disponível)
    try {
      const whereConditions: any = { status: 'active' };

      if (email) {
        const customer = await prisma.customer.findUnique({ where: { email } });
        if (customer) {
          whereConditions.customerId = customer.id;
        }
      }

      if (orderId) {
        whereConditions.orderId = orderId;
      }

      const cred = await prisma.accessCredentials.findFirst({
        where: whereConditions,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          order: { include: { plan: true } },
        },
      });

      if (cred) {
        return NextResponse.json({
          ok: true,
          username: cred.username,
          licenseKey: cred.licenseKey || 'FV-ATIVADA',
          credits: cred.credits || 100,
          accessUrl: cred.accessUrl,
          driveUrl: driveUrl(),
          whatsappUrl: whatsappUrl(),
          courseUrl: cred.courseUrl || driveUrl(),
          colabUrl: colabUrl(),
          planName: cred.order?.plan?.name || 'Fábrica dos Cortes',
          status: cred.status,
          expiresAt: cred.expiresAt,
        });
      }
    } catch (prismaErr) {
      console.warn('[access/find] Prisma indisponível no momento:', prismaErr);
    }

    // 2. Busca na API da AbacatePay para verificar o status do pedido
    const apiKey = process.env.ABACATEPAY_API_KEY || 'abc_dev_zWzyHEKWK5cX6gZf63HUWpZy';
    let matchingCheckout: any = null;

    try {
      const res = await fetch('https://api.abacatepay.com/v2/checkouts/list', {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        const checkouts = json.data || [];
        matchingCheckout = checkouts.find((c: any) => {
          const meta = c.metadata || {};
          const cEmail = (meta.email || c.customer?.email || '').trim().toLowerCase();
          const cOrderId = (meta.orderId || c.id || '').trim();
          if (orderId && (cOrderId === orderId || c.id === orderId)) return true;
          if (email && cEmail === email) return true;
          return false;
        });
      }
    } catch (err) {
      console.warn('[access/find] Falha ao consultar AbacatePay:', err);
    }

    if (matchingCheckout) {
      const isPaid = matchingCheckout.status === 'PAID';
      if (!isPaid) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Pagamento Pix pendente. Assim que o Pix for confirmado no seu banco, sua licença e créditos serão liberados instantaneamente nesta tela.',
            status: matchingCheckout.status,
          },
          { status: 400 }
        );
      }

      // Se está pago na AbacatePay:
      const meta = matchingCheckout.metadata || {};
      const slug = meta.slug || 'pack_criador';
      const credits = slug === 'pack_teste' ? 15 : slug === 'pack_iniciante' ? 30 : slug === 'pack_escala' ? 120 : slug === 'pack_pro' ? 250 : 50;
      
      let licenseKey = meta.licenseKey;
      if (!licenseKey) {
        const licenses = await listLicensesFromServer().catch(() => []);
        if (licenses && licenses.length > 0) {
          licenseKey = licenses[0].license_key;
        } else {
          const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
          licenseKey = `FC-${randomSuffix}-ATIVADA`;
          await createLicenseOnServer({
            licenseKey,
            credits,
            days: 365,
            plan: slug,
          }).catch(() => null);
        }
      }

      return NextResponse.json({
        ok: true,
        username: email ? email.split('@')[0] : 'criador_vip',
        licenseKey: licenseKey || 'FC-VIP-ATIVADA',
        credits,
        accessUrl: 'https://fabricadecortes.com/acesso',
        driveUrl: driveUrl(),
        whatsappUrl: whatsappUrl(),
        courseUrl: driveUrl(),
        colabUrl: colabUrl(),
        planName: 'Fábrica dos Cortes - Licença Oficial',
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    // 3. Se não achou na AbacatePay nem no Prisma, verifica se existe alguma licença no servidor Railway
    if (email) {
      const railwayLicenses = await listLicensesFromServer().catch(() => []);
      if (railwayLicenses && railwayLicenses.length > 0) {
        const lic = railwayLicenses[0];
        return NextResponse.json({
          ok: true,
          username: email.split('@')[0],
          licenseKey: lic.license_key,
          credits: lic.credits,
          accessUrl: 'https://fabricadecortes.com/acesso',
          driveUrl: driveUrl(),
          whatsappUrl: whatsappUrl(),
          courseUrl: driveUrl(),
          colabUrl: colabUrl(),
          planName: 'Fábrica dos Cortes - Licença Oficial',
          status: lic.status,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    }

    return NextResponse.json(
      {
        ok: false,
        error: 'Nenhum pedido ou licença ativa encontrada para este e-mail. Se você acabou de pagar o Pix, aguarde 1 a 2 minutos pela compensação bancária.',
      },
      { status: 404 }
    );
  } catch (globalErr: any) {
    console.error('[access/find] Erro inesperado:', globalErr);
    return NextResponse.json(
      { ok: false, error: 'Não foi possível consultar seu acesso no momento. Tente novamente em instantes.' },
      { status: 500 }
    );
  }
}
