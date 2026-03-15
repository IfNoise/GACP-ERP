import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { PgDatabase } from 'drizzle-orm/pg-core';
import type { NodePgQueryResultHKT } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export type Database = ReturnType<typeof createDatabase>;

/**
 * Accepts both the full Database instance and a PgTransaction context.
 * Use as the parameter type for repository methods that must run within
 * a caller-managed transaction (e.g. `*WithTx` variants).
 *
 * Both NodePgDatabase and PgTransaction extend PgDatabase, so assignments
 * from both are valid without requiring the `$client: Pool` discriminant.
 */
export type DbContext = PgDatabase<NodePgQueryResultHKT, typeof schema>;

/**
 * Creates a DrizzleORM database instance backed by a pg connection pool.
 *
 * @example
 * const db = createDatabase(process.env.DATABASE_URL);
 */
export function createDatabase(
  connectionString: string,
): ReturnType<typeof drizzle<typeof schema>> {
  const pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  return drizzle(pool, { schema, logger: process.env['NODE_ENV'] === 'development' });
}

export * from './schema';
