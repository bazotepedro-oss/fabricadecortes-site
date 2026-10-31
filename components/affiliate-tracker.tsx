'use client';

import { useEffect } from 'react';

/**
 * Componente invisível que captura parâmetros de indicação de parceiros (?ref=... ou ?cupom=...)
 * e persiste em cookie e localStorage para atribuir vendas futuras ao YouTuber correto.
 */
export function AffiliateTracker() {
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;

      const params = new URLSearchParams(window.location.search);
      const ref =
        params.get('ref') ||
        params.get('aff') ||
        params.get('cupom') ||
        params.get('c') ||
        params.get('apoiador');

      if (ref && ref.trim()) {
        const cleanRef = ref.trim().toUpperCase();
        
        // 1. Armazena no LocalStorage
        localStorage.setItem('forja_affiliate_ref', cleanRef);

        // 2. Armazena em Cookie com validade de 30 dias (2.592.000 segundos)
        const maxAge = 30 * 24 * 60 * 60;
        document.cookie = `forja_affiliate_ref=${encodeURIComponent(cleanRef)}; path=/; max-age=${maxAge}; SameSite=Lax`;

        console.log(`[Fábrica dos Cortes] Parceiro identificado e salvo: ${cleanRef}`);
      }
    } catch (e) {
      // Ignora falhas silenciosas de storage/cookie
    }
  }, []);

  return null;
}
