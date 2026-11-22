import Script from 'next/script';

// Google Tag Manager / Google tag do site (Google Ads e Analytics sao configurados dentro do container).
export const GTM_ID = 'GTM-WH56PB9M';

export function GoogleTags() {
  return (
    <>
      <Script id="google-tag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = window.gtag || gtag;
gtag('js', new Date());`}
      </Script>
      <Script
        id="google-tag-manager"
        src={`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`}
        strategy="afterInteractive"
      />
    </>
  );
}
