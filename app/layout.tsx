import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { AffiliateTracker } from '@/components/affiliate-tracker';
import { GoogleTags } from '@/components/google-tags';
import { SITE_URL, SITE_NAME, GLOBAL_KEYWORDS, DEFAULT_OG_IMAGE } from '@/lib/seo';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Fábrica dos Cortes | Cortes com IA para TikTok, Reels e Shorts',
    template: '%s',
  },
  description:
    'Cortes com IA para podcasts, lives e streamers: a IA escolhe os melhores momentos, enquadra o rosto e coloca legenda animada. Melhores Momentos para o YouTube. Sem mensalidade, créditos no Pix.',
  keywords: GLOBAL_KEYWORDS,
  applicationName: SITE_NAME,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/',
    siteName: SITE_NAME,
    title: 'Fábrica dos Cortes | Cortes com IA para TikTok, Reels e Shorts',
    description: 'Cortes virais com IA para podcasts, lives e streamers, com legenda animada. Sem mensalidade, créditos no Pix.',
    images: [{ url: DEFAULT_OG_IMAGE, alt: 'Fábrica dos Cortes: cortes com IA' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fábrica dos Cortes | Cortes com IA',
    description: 'Cortes virais com IA para podcasts, lives e streamers. Sem mensalidade, créditos no Pix.',
    images: [DEFAULT_OG_IMAGE],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`dark ${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-screen bg-background text-text-primary font-sans antialiased selection:bg-brand selection:text-white">
        <GoogleTags />
        <AffiliateTracker />
        {children}
      </body>
    </html>
  );
}