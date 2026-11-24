'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';

// Pixel da Meta (Facebook/Instagram Ads).
export const META_PIXEL_ID = '2195916970999808';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

// O site troca de página sem recarregar: registra um PageView a cada navegação.
function PageViewOnNavigate() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false; // o primeiro PageView já vai no código base
      return;
    }
    window.fbq?.('track', 'PageView');
  }, [pathname, searchParams]);

  return null;
}

export function MetaPixel() {
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          alt=""
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
      <Suspense fallback={null}>
        <PageViewOnNavigate />
      </Suspense>
    </>
  );
}
