/**
 * Database migration runner — applies all pending DrizzleORM SQL migrations.
 *
 * Usage:
 *   DATABASE_URL=postgresql://... node -r ts-node/register src/migrate.ts
 *   (or via docker entrypoint before starting the app)
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import path from 'path';

async function runMigrations(): Promise<void> {
  const connectionString =
    process.env['DATABASE_URL'] ?? 'postgresql://gacp_user:gacp_pass@localhost:5432/gacp_erp';

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  const migrationsFolder = path.join(__dirname, 'migrations');

  console.log('🔄 Running GACP-ERP database migrations...');
  console.log(`   Migrations folder: ${migrationsFolder}`);
  console.log(`   Target:            ${connectionString.replace(/:[^:@]+@/, ':***@')}`);

  await migrate(db, { migrationsFolder });

  console.log('✅ Migrations completed successfully');
  await pool.end();
}

runMigrations().catch((err: unknown) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
