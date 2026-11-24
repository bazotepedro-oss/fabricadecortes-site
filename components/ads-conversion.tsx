'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

const SEND_TO = 'AW-18586283151/E4WNCMjLyL0dEI_Z0J5F';

/** Compra no Pixel da Meta. O fbq pode ainda estar carregando: tenta por alguns segundos. */
function metaPurchase(transactionId: string, value?: number) {
  let tries = 0;
  const send = () => {
    if (window.fbq) {
      window.fbq(
        'track',
        'Purchase',
        { value: Number(value || 0), currency: 'BRL', content_type: 'product' },
        { eventID: `purchase_${transactionId}` }, // mesmo ID da API de Conversoes: a Meta nao conta duas vezes
      );
      return;
    }
    if (tries++ < 20) setTimeout(send, 500);
  };
  send();
}

/**
 * Conversao de compra do Google Ads e da Meta. So e renderizado quando o pedido esta pago.
 * Recarregar a pagina nao conta de novo: o navegador lembra o pedido e o Google
 * tambem ignora o mesmo transaction_id repetido.
 */
export function AdsConversion({ transactionId, value }: { transactionId: string; value?: number }) {
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
    metaPurchase(transactionId, value);
    try {
      window.localStorage.setItem(key, String(Date.now()));
    } catch {
      // ignora
    }
  }, [transactionId, value]);

  return null;
}
