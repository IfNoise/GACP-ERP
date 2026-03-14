import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export type Database = ReturnType<typeof createDatabase>;

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
