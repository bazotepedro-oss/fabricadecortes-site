import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo';

// Libera as páginas públicas e esconde áreas privadas (admin, acesso, API, retorno de pagamento).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/acesso', '/retorno', '/obrigado', '/parceiro/', '/checkout', '/membros'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
