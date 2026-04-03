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

  // Stub Node-only modules that @xeokit/xeokit-sdk references internally
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    return config;
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
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' ${new URL(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').origin}; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
