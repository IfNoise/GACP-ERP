import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema/index.ts',
  out: './src/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL'] ?? 'postgresql://gacp_user:gacp_pass@localhost:5432/gacp_erp',
  },
  verbose: true,
  strict: true,
} satisfies Config;
