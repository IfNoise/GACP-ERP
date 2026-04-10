import {
  parseDatabaseConfig,
  parseKafkaConfig,
  parseRedisConfig,
  parseAppConfig,
  parseImmudbConfig,
} from './config.schemas';

const baseEnv: Record<string, string> = {
  POSTGRES_HOST: 'localhost',
  POSTGRES_PORT: '5432',
  POSTGRES_USER: 'user',
  POSTGRES_PASSWORD: 'pass',
  POSTGRES_DB: 'gacp',
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/gacp',
  KAFKA_BROKERS: 'localhost:9092',
  KAFKA_CLIENT_ID: 'test-client',
  KAFKA_GROUP_ID: 'test-group',
  REDIS_HOST: 'localhost',
  REDIS_URL: 'redis://localhost:6379',
  NODE_ENV: 'test',
  HMAC_SECRET: 'a'.repeat(32),
  IMMUDB_HOST: 'localhost',
  IMMUDB_USER: 'immudb',
  IMMUDB_PASSWORD: 'immudb',
  IMMUDB_DATABASE: 'defaultdb',
};

describe('parseDatabaseConfig', () => {
  it('parses valid env', () => {
    const cfg = parseDatabaseConfig(baseEnv as unknown as NodeJS.ProcessEnv);
    expect(cfg.host).toBe('localhost');
    expect(cfg.port).toBe(5432);
  });

  it('throws on missing DATABASE_URL', () => {
    const env = { ...baseEnv, DATABASE_URL: '' };
    expect(() => parseDatabaseConfig(env as unknown as NodeJS.ProcessEnv)).toThrow();
  });
});

describe('parseKafkaConfig', () => {
  it('parses and splits brokers', () => {
    const cfg = parseKafkaConfig(baseEnv as unknown as NodeJS.ProcessEnv);
    expect(cfg.brokers).toEqual(['localhost:9092']);
  });

  it('uses clientId override', () => {
    const cfg = parseKafkaConfig(baseEnv as unknown as NodeJS.ProcessEnv, 'custom');
    expect(cfg.clientId).toBe('custom');
  });
});

describe('parseRedisConfig', () => {
  it('parses with defaults', () => {
    const cfg = parseRedisConfig(baseEnv as unknown as NodeJS.ProcessEnv);
    expect(cfg.port).toBe(6379);
    expect(cfg.ttlSeconds).toBe(300);
  });
});

describe('parseAppConfig', () => {
  it('parses valid env', () => {
    const cfg = parseAppConfig(baseEnv as unknown as NodeJS.ProcessEnv);
    expect(cfg.nodeEnv).toBe('test');
    expect(cfg.hmacSecret).toHaveLength(32);
  });
});

describe('parseImmudbConfig', () => {
  it('parses valid env', () => {
    const cfg = parseImmudbConfig(baseEnv as unknown as NodeJS.ProcessEnv);
    expect(cfg.host).toBe('localhost');
    expect(cfg.port).toBe(3322);
  });
});
