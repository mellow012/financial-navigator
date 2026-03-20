import type { NextConfig } from 'next';

/**
 * SmartFin MW — Next.js Config
 *
 * Removed `output: 'export'` → static export breaks API routes (Claude AI)
 * Removed `next-intl` plugin → requires messages/ folder; add back when i18n is wired
 * Deploy target: Vercel free tier.
 */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;