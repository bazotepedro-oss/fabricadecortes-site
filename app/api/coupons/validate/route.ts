import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code') || searchParams.get('ref');

    if (!code || !code.trim()) {
      return NextResponse.json({ valid: false, error: 'Informe um código ou cupom' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    // Busca afiliado ativo por cupom ou por slug
    const affiliate = await prisma.affiliate.findFirst({
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
