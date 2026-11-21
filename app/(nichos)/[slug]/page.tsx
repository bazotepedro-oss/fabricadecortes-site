import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, CheckCircle2, Zap } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { JsonLd } from '@/components/json-ld';
import { NICHE_PAGES, getNichePage, absoluteUrl, DEFAULT_OG_IMAGE, SITE_NAME } from '@/lib/seo';

// Páginas de nicho (cortes com IA, cortes de live, GTA 6...). Geradas no build;
// qualquer outro endereço cai no 404 normal.
export const dynamicParams = false;

export function generateStaticParams() {
  return NICHE_PAGES.map((page) => ({ slug: page.slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const page = getNichePage(slug);
  if (!page) return {};
  const path = `/${page.slug}`;
  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      url: path,
      siteName: SITE_NAME,
      title: page.title,
      description: page.description,
      images: [{ url: DEFAULT_OG_IMAGE, alt: page.h1 + ' ' + page.h1Highlight }],
    },
    twitter: { card: 'summary_large_image', title: page.title, description: page.description, images: [DEFAULT_OG_IMAGE] },
  };
}

export default async function NichePageView({ params }: Params) {
  const { slug } = await params;
  const page = getNichePage(slug);
  if (!page) notFound();

  const related = page.related
    .map((relatedSlug) => getNichePage(relatedSlug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE_NAME, item: absoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: page.h1.replace(/:$/, ''), item: absoluteUrl(`/${page.slug}`) },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: page.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: { '@type': 'Answer', text: faq.a },
      })),
    },
  ];

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <JsonLd data={structuredData} />
      <Navbar />

      <main>
        <section className="relative overflow-hidden border-b border-border">
          <div className="pointer-events-none absolute inset-0 bg-brand-radial" />
          <div className="relative mx-auto w-full max-w-4xl px-4 py-16 text-center md:py-24">
            <nav aria-label="Você está em" className="mb-6 text-xs text-text-secondary">
              <Link href="/" className="hover:text-text-primary">Fábrica dos Cortes</Link>
              <span className="mx-2">/</span>
              <span className="text-text-primary">{page.h1.replace(/:$/, '')}</span>
            </nav>
            <Badge variant="brand" className="mb-4">{page.badge}</Badge>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-text-primary md:text-5xl">
              {page.h1}{' '}
              <span className="bg-gradient-to-r from-brand via-orange-500 to-amber-400 bg-clip-text text-transparent">
                {page.h1Highlight}
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-text-secondary md:text-lg">{page.lead}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-2xl px-8 font-bold">
                <Link href="/precos">
                  <Zap className="h-5 w-5" /> Ver pacotes a partir de R$ 19,90 <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 rounded-2xl px-6">
                <Link href="/#como-funciona">Como funciona</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-b border-border py-16">
          <div className="mx-auto w-full max-w-3xl space-y-12 px-4">
            {page.sections.map((section) => (
              <article key={section.title} className="space-y-4">
                <h2 className="font-display text-2xl font-bold text-text-primary md:text-3xl">{section.title}</h2>
                <p className="leading-relaxed text-text-secondary">{section.body}</p>
                {section.bullets && (
                  <ul className="space-y-2">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2 text-text-secondary">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}

            <article className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-text-primary md:text-3xl">Passo a passo</h2>
              <ol className="space-y-3">
                {page.steps.map((step, index) => (
                  <li key={step} className="flex items-start gap-3 rounded-2xl border border-border/80 bg-surface/60 p-4 text-text-secondary">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/15 text-sm font-bold text-brand">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </article>

            <article className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-text-primary md:text-3xl">Perguntas frequentes</h2>
              <div className="space-y-3">
                {page.faqs.map((faq) => (
                  <details key={faq.q} className="group rounded-2xl border border-border/80 bg-surface/60 p-5 open:border-brand/40">
                    <summary className="cursor-pointer list-none font-semibold text-text-primary">{faq.q}</summary>
                    <p className="mt-3 text-sm leading-relaxed text-text-secondary">{faq.a}</p>
                  </details>
                ))}
              </div>
            </article>

            {page.disclaimer && <p className="text-xs leading-relaxed text-text-secondary/80">{page.disclaimer}</p>}
          </div>
        </section>

        <section className="border-b border-border py-16">
          <div className="mx-auto w-full max-w-4xl px-4 text-center">
            <h2 className="font-display text-2xl font-bold text-text-primary md:text-3xl">Comece hoje, sem mensalidade</h2>
            <p className="mx-auto mt-3 max-w-xl text-text-secondary">
              Compre créditos no Pix, receba a licença na hora e use quando quiser. Cada crédito vale um corte completo.
            </p>
            <Button asChild size="lg" className="mt-6 h-12 rounded-2xl px-8 font-bold">
              <Link href="/precos">
                Ver pacotes <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>

            {related.length > 0 && (
              <div className="mt-12">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-secondary">Veja também</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {related.map((item) => (
                    <Link
                      key={item.slug}
                      href={`/${item.slug}`}
                      className="rounded-2xl border border-border/80 bg-surface/60 p-4 text-left transition-colors hover:border-brand/40"
                    >
                      <span className="block font-semibold text-text-primary">
                        {item.h1.replace(/:$/, '')}
                      </span>
                      <span className="mt-1 block text-sm text-text-secondary">{item.h1Highlight}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
