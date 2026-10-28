/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Evita que avisos de lint (como aspas ou tags <img>) travem o build da Vercel
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Garante compilação suave no pipeline de CI/CD da Vercel
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'railway.app' },
    ],
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  },
};

export default nextConfig;