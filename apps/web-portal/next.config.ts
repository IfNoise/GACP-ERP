import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Standalone output for Docker production builds
  output: 'standalone',

  // Transpile shared monorepo packages
  transpilePackages: [
    '@gacp-erp/shared-schemas',
    '@gacp-erp/shared-contracts',
    '@gacp-erp/shared-events',
  ],

  experimental: {
    // React 19 server actions
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
