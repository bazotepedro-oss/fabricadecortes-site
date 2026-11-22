'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const SEND_TO = 'AW-18586283151/E4WNCMjLyL0dEI_Z0J5F';

/**
 * Conversao de compra do Google Ads. So e renderizado quando o pedido esta pago.
 * Recarregar a pagina nao conta de novo: o navegador lembra o pedido e o Google
 * tambem ignora o mesmo transaction_id repetido.
 */
export function AdsConversion({ transactionId }: { transactionId: string; value?: number }) {
  useEffect(() => {
    if (!transactionId) return;
    const key = `fdc_conv_${transactionId}`;
    try {
      if (window.localStorage.getItem(key)) return;
    } catch {
      // navegador sem localStorage: segue, o transaction_id evita duplicar
    }
    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) {
      window.gtag = function gtag() {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer!.push(arguments);
      };
    }
    window.gtag('event', 'conversion', {
      send_to: SEND_TO,
      value: 1.0, // valor fixo: a conversao no Google Ads esta configurada para contar 1 por venda
      currency: 'BRL',
      transaction_id: transactionId,
    });
    try {
      window.localStorage.setItem(key, String(Date.now()));
    } catch {
      // ignora
    }
  }, [transactionId]);

  return null;
}
