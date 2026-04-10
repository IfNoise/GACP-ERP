import { z } from 'zod';

// ─── Database ─────────────────────────────────────────────────────────────────

export const DatabaseConfigSchema = z.object({
  host: z.string().min(1),
  port: z.coerce.number().int().positive().default(5432),
  user: z.string().min(1),
  password: z.string().min(1),
  database: z.string().min(1),
  url: z.string().url(),
  poolMin: z.coerce.number().int().nonnegative().default(2),
  poolMax: z.coerce.number().int().positive().default(10),
});
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;

export function parseDatabaseConfig(env: NodeJS.ProcessEnv): DatabaseConfig {
  return DatabaseConfigSchema.parse({
    host: env['POSTGRES_HOST'],
    port: env['POSTGRES_PORT'],
    user: env['POSTGRES_USER'],
    password: env['POSTGRES_PASSWORD'],
    database: env['POSTGRES_DB'],
    url: env['DATABASE_URL'],
    poolMin: env['DB_POOL_MIN'],
    poolMax: env['DB_POOL_MAX'],
  });
}

// ─── Kafka ────────────────────────────────────────────────────────────────────

export const KafkaConfigSchema = z.object({
  brokers: z
    .string()
    .min(1)
    .transform((v) => v.split(',')),
  clientId: z.string().min(1),
  groupId: z.string().min(1),
  /** Retry attempts before giving up on a produce */
  retries: z.coerce.number().int().nonnegative().default(3),
  /** Request timeout in ms */
  requestTimeoutMs: z.coerce.number().int().positive().default(30_000),
});
export type KafkaConfig = z.infer<typeof KafkaConfigSchema>;

export function parseKafkaConfig(env: NodeJS.ProcessEnv, clientId?: string): KafkaConfig {
  return KafkaConfigSchema.parse({
    brokers: env['KAFKA_BROKERS'],
    clientId: clientId ?? env['KAFKA_CLIENT_ID'],
    groupId: env['KAFKA_GROUP_ID'],
    retries: env['KAFKA_RETRIES'],
    requestTimeoutMs: env['KAFKA_REQUEST_TIMEOUT_MS'],
  });
}

// ─── Redis ────────────────────────────────────────────────────────────────────

export const RedisConfigSchema = z.object({
  host: z.string().min(1),
  port: z.coerce.number().int().positive().default(6379),
  password: z.string().optional(),
  url: z.string().min(1),
  ttlSeconds: z.coerce.number().int().positive().default(300),
});
export type RedisConfig = z.infer<typeof RedisConfigSchema>;

export function parseRedisConfig(env: NodeJS.ProcessEnv): RedisConfig {
  return RedisConfigSchema.parse({
    host: env['REDIS_HOST'],
    port: env['REDIS_PORT'],
    password: env['REDIS_PASSWORD'],
    url: env['REDIS_URL'],
    ttlSeconds: env['REDIS_TTL_SECONDS'],
  });
}

// ─── App ──────────────────────────────────────────────────────────────────────

export const AppConfigSchema = z.object({
  nodeEnv: z.enum(['development', 'test', 'production']).default('development'),
  port: z.coerce.number().int().positive().default(3000),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  /** Used for HMAC QR signatures */
  hmacSecret: z.string().min(32),
});
export type AppConfig = z.infer<typeof AppConfigSchema>;

export function parseAppConfig(env: NodeJS.ProcessEnv): AppConfig {
  return AppConfigSchema.parse({
    nodeEnv: env['NODE_ENV'],
    port: env['PORT'],
    logLevel: env['LOG_LEVEL'],
    hmacSecret: env['HMAC_SECRET'],
  });
}

// ─── ImmuDB ───────────────────────────────────────────────────────────────────

export const ImmudbConfigSchema = z.object({
  host: z.string().min(1),
  port: z.coerce.number().int().positive().default(3322),
  user: z.string().min(1),
  password: z.string().min(1),
  database: z.string().min(1),
});
export type ImmudbConfig = z.infer<typeof ImmudbConfigSchema>;

export function parseImmudbConfig(env: NodeJS.ProcessEnv): ImmudbConfig {
  return ImmudbConfigSchema.parse({
    host: env['IMMUDB_HOST'],
    port: env['IMMUDB_PORT'],
    user: env['IMMUDB_USER'],
    password: env['IMMUDB_PASSWORD'],
    database: env['IMMUDB_DATABASE'],
  });
}
