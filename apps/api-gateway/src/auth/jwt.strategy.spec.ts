import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { type ConfigService } from '@nestjs/config';

// We can't call `super()` with real JWKS in a unit test,
// so we test only the `validate()` method which is the custom logic.

function createStrategy(): JwtStrategy {
  // Use Object.create to get an instance without calling the real constructor
  // (the constructor talks to JWKS endpoints which are unavailable in unit tests).
  const config = {
    getOrThrow: (key: string) => {
      if (key === 'ZITADEL_JWKS_URI') return 'https://zitadel.local/oauth/v2/certs';
      if (key === 'ZITADEL_ISSUER') return 'https://zitadel.local';
      throw new Error(`Unexpected config key: ${key}`);
    },
    get: (_key: string, fallback: string) => fallback,
  } as unknown as ConfigService;

  const proto = JwtStrategy.prototype;
  const instance = Object.create(proto) as JwtStrategy;
  // Attach config for potential use
  Object.defineProperty(instance, 'config', { value: config });
  return instance;
}

describe('JwtStrategy — validate()', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    strategy = createStrategy();
  });

  it('returns a valid JwtPayload for a token with Zitadel project roles', () => {
    const payload: Record<string, unknown> = {
      sub: 'user-ulid-1',
      email: 'user@example.com',
      preferred_username: 'user1',
      given_name: 'John',
      family_name: 'Doe',
      // Real Zitadel format: keys are role names, values are org context objects
      'urn:zitadel:iam:org:project:roles': { OPERATOR: { org123: 'proj456' } },
      iat: 1000000,
      exp: 2000000,
      jti: 'jti-1',
      iss: 'https://zitadel.local',
      aud: 'api-gateway',
    };

    const result = strategy.validate(payload);

    expect(result.sub).toBe('user-ulid-1');
    expect(result.email).toBe('user@example.com');
    expect(result.preferred_username).toBe('user1');
    expect(result.realm_access.roles).toEqual(['OPERATOR']);
    expect(result.iat).toBe(1000000);
    expect(result.exp).toBe(2000000);
  });

  it('throws UnauthorizedException when Zitadel roles claim is missing', () => {
    const payload: Record<string, unknown> = {
      sub: 'user-ulid-2',
      preferred_username: 'user2',
      iat: 1000000,
      exp: 2000000,
      iss: 'issuer',
    };

    expect(() => strategy.validate(payload)).toThrow(UnauthorizedException);
    expect(() => strategy.validate(payload)).toThrow('Token contains no project roles');
  });

  it('throws UnauthorizedException when roles object is empty', () => {
    const payload: Record<string, unknown> = {
      sub: 'user-ulid-3',
      preferred_username: 'user3',
      'urn:zitadel:iam:org:project:roles': {},
      iat: 1000000,
      exp: 2000000,
      iss: 'issuer',
    };

    expect(() => strategy.validate(payload)).toThrow(UnauthorizedException);
  });

  it('handles optional fields gracefully (undefined values)', () => {
    const payload: Record<string, unknown> = {
      sub: 'user-ulid-4',
      preferred_username: 'user4',
      'urn:zitadel:iam:org:project:roles': { READONLY: { org123: 'proj456' } },
      iat: 1000000,
      exp: 2000000,
      iss: 'issuer',
    };

    const result = strategy.validate(payload);

    expect(result.email).toBeUndefined();
    expect(result.given_name).toBeUndefined();
    expect(result.family_name).toBeUndefined();
    expect(result.jti).toBeUndefined();
    expect(result.aud).toBeUndefined();
  });

  it('handles multiple roles from different role IDs', () => {
    const payload: Record<string, unknown> = {
      sub: 'user-ulid-5',
      preferred_username: 'admin',
      'urn:zitadel:iam:org:project:roles': {
        SUPER_ADMIN: { org123: 'proj456' },
        QUALITY_MANAGER: { org123: 'proj456' },
      },
      iat: 1000000,
      exp: 2000000,
      iss: 'issuer',
    };

    const result = strategy.validate(payload);

    expect(result.realm_access.roles).toEqual(['SUPER_ADMIN', 'QUALITY_MANAGER']);
  });

  it('flattens roles from single role ID with multiple role names', () => {
    const payload: Record<string, unknown> = {
      sub: 'user-ulid-6',
      preferred_username: 'poweruser',
      'urn:zitadel:iam:org:project:roles': {
        CULTIVATION_MANAGER: { org123: 'proj456' },
        QUALITY_MANAGER: { org123: 'proj456' },
      },
      iat: 1000000,
      exp: 2000000,
      iss: 'issuer',
    };

    const result = strategy.validate(payload);

    expect(result.realm_access.roles).toEqual(['CULTIVATION_MANAGER', 'QUALITY_MANAGER']);
  });
});
