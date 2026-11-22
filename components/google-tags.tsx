import Script from 'next/script';

// Google Tag Manager do site + tag do Google Ads (necessaria para a conversao de compra
// funcionar mesmo que o container do GTM nao tenha a tag do Ads publicada).
export const GTM_ID = 'GTM-WH56PB9M';
export const ADS_ID = 'AW-18586283151';

export function GoogleTags() {
  return (
    <>
      <Script id="google-tag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = window.gtag || gtag;
gtag('js', new Date());
gtag('config', '${ADS_ID}');`}
      </Script>
      <Script
        id="google-tag-manager"
        src={`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-ads-tag"
        src={`https://www.googletagmanager.com/gtag/js?id=${ADS_ID}`}
        strategy="afterInteractive"
      />
    </>
  );
}
