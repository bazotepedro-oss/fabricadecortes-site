import type { MetadataRoute } from 'next';
import { NICHE_PAGES, absoluteUrl } from '@/lib/seo';

// Mapa do site para o Google: páginas públicas + páginas de nicho.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const core: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/precos'), lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: absoluteUrl('/faq'), lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: absoluteUrl('/contato'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl('/suporte'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl('/termos'), lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: absoluteUrl('/privacidade'), lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];
  const niches: MetadataRoute.Sitemap = NICHE_PAGES.map((page) => ({
    url: absoluteUrl(`/${page.slug}`),
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));
  return [...core, ...niches];
}
