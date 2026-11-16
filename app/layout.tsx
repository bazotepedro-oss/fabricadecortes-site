import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { AffiliateTracker } from '@/components/affiliate-tracker';

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
  title: 'Fábrica dos Cortes | Cortes virais e Melhores Momentos com IA',
  description: 'Transforme podcasts em cortes para TikTok, Reels e Shorts e monte o Melhores Momentos em 16:9 para o YouTube, com legendas, capítulos e IA. Sem mensalidade, créditos no Pix.',
  openGraph: {
    title: 'Fábrica dos Cortes (fabricadecortes.com)',
    description: 'Cortes virais e compilado Melhores Momentos para YouTube com IA. Sem mensalidade, créditos no Pix.',
    type: 'website',
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`dark ${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-screen bg-background text-text-primary font-sans antialiased selection:bg-brand selection:text-white">
        <AffiliateTracker />
        {children}
      </body>
    </html>
  );
}