import { getActivePlans } from '@/lib/plans';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Hero } from '@/components/sections/hero';
import { StatsStrip } from '@/components/sections/stats-strip';
import { MelhoresMomentos } from '@/components/sections/melhores-momentos';
import { ComoFunciona } from '@/components/sections/como-funciona';
import { Recursos } from '@/components/sections/recursos';
import { ComparativoSection } from '@/components/sections/comparativo';
import { Depoimentos } from '@/components/sections/depoimentos';
import { PlanosSection } from '@/components/sections/planos-section';
import { FAQSection } from '@/components/sections/faq-section';
import { CTAFinal } from '@/components/sections/cta-final';
import { JsonLd } from '@/components/json-ld';
import { FAQ } from '@/lib/faq-data';
import { SITE_URL, SITE_NAME, absoluteUrl } from '@/lib/seo';

export const revalidate = 60;

export default async function HomePage() {
  const plans = await getActivePlans();
  const prices = plans.map((plan) => plan.price).filter((price) => price > 0);

  // Dados estruturados: empresa, site, o aplicativo com a faixa de preço e o FAQ.
  // (Sem nota/avaliação: o Google pune avaliações que não vêm de clientes verificados.)
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: absoluteUrl('/logo.png'),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: 'pt-BR',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: SITE_NAME,
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Windows, Google Colab',
      description:
        'Cortes com IA para TikTok, Reels e Shorts: escolha automática dos melhores momentos, enquadramento vertical, legenda animada e compilado Melhores Momentos para o YouTube.',
      url: SITE_URL,
      ...(prices.length
        ? {
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'BRL',
              lowPrice: (Math.min(...prices) / 100).toFixed(2),
              highPrice: (Math.max(...prices) / 100).toFixed(2),
              offerCount: prices.length,
            },
          }
        : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
  ];

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <JsonLd data={structuredData} />
      <Navbar />
      <Hero />
      <StatsStrip />
      <MelhoresMomentos />
      <ComoFunciona />
      <Recursos />
      <ComparativoSection />
      <Depoimentos />
      <PlanosSection plans={plans} />
      <FAQSection />
      <CTAFinal />
      <Footer />
    </div>
  );
}