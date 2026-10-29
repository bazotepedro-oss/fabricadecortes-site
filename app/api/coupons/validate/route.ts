import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { syncListAffiliates } from '@/lib/members-sync';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code') || searchParams.get('ref');

    if (!code || !code.trim()) {
      return NextResponse.json({ valid: false, error: 'Informe um código ou cupom' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    // 1. Busca afiliado ativo por cupom ou por slug no banco local
    let affiliate = await prisma.affiliate.findFirst({
      where: {
        active: true,
        OR: [
          { couponCode: cleanCode },
          { slug: cleanCode.toLowerCase() },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        couponCode: true,
        discountPercent: true,
        commissionPercent: true,
      },
    });

    // 2. Se não encontrou no container atual, hidrata da HostGator
    if (!affiliate) {
      try {
        const hgAffiliates = await syncListAffiliates().catch(() => []);
        for (const hg of hgAffiliates) {
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
            },
          }).catch(() => null);
        }

        affiliate = await prisma.affiliate.findFirst({
          where: {
            active: true,
            OR: [
              { couponCode: cleanCode },
              { slug: cleanCode.toLowerCase() },
            ],
          },
          select: {
            id: true,
            name: true,
            slug: true,
            couponCode: true,
            discountPercent: true,
            commissionPercent: true,
          },
        });
      } catch (hydrateErr) {
        console.warn('[Coupons API] Erro ao hidratar da HostGator:', hydrateErr);
      }
    }

    if (!affiliate) {
      return NextResponse.json(
        { valid: false, error: 'Cupom ou código de apoiador inválido ou expirado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      couponCode: affiliate.couponCode,
      affiliateId: affiliate.id,
      affiliateName: affiliate.name,
      discountPercent: affiliate.discountPercent,
      commissionPercent: affiliate.commissionPercent,
    });
  } catch (error: any) {
    console.error('[Coupons API] Erro ao validar cupom:', error);
    return NextResponse.json({ valid: false, error: 'Erro ao validar cupom' }, { status: 500 });
  }
}
