import { UnauthorizedException } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockConfig: Record<string, string> = {
  ZITADEL_URL: 'http://zitadel:8080',
  ZITADEL_CLIENT_ID: 'api-gateway',
  ZITADEL_CLIENT_SECRET: 'secret',
  ZITADEL_PROJECT_ID: 'test-project-id',
  REAUTH_SECRET: 'reauth-secret-key',
};

function makeConfigService(): ConfigService {
  return {
    getOrThrow: (key: string) => {
      const v = mockConfig[key];
      if (v === undefined) throw new Error(`Missing config key: ${key}`);
      return v;
    },
  } as unknown as ConfigService;
}

function makeZitadelTokens() {
  return {
    access_token: 'at-123',
    refresh_token: 'rt-456',
    expires_in: 300,
    token_type: 'Bearer',
  };
}

const mockUser = {
  sub: 'user-ulid-001',
  preferred_username: 'jane.doe',
  email: 'jane@test.com',
  given_name: 'Jane',
  family_name: 'Doe',
  realm_access: { roles: ['OPERATOR'] },
  iat: 1000,
  exp: 2000,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new AuthService(makeConfigService());
    fetchSpy = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  // ─── login ──────────────────────────────────────────────────────────────

  describe('login', () => {
    it('returns tokens on success', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(makeZitadelTokens()),
      });

      const result = await service.login({ username: 'jane', password: 'pass' });

      expect(result.access_token).toBe('at-123');
      expect(result.refresh_token).toBe('rt-456');
      expect(result.token_type).toBe('Bearer');
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('throws UnauthorizedException on Zitadel failure', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'invalid_grant' }),
      });

      await expect(service.login({ username: 'bad', password: 'bad' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when json() rejects', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        json: () => Promise.reject(new Error('bad json')),
      });

      await expect(service.login({ username: 'bad', password: 'bad' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ─── refresh ────────────────────────────────────────────────────────────

  describe('refresh', () => {
    it('returns tokens on success', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(makeZitadelTokens()),
      });

      const result = await service.refresh({ refresh_token: 'rt-old' });

      expect(result.access_token).toBe('at-123');
      expect(result.token_type).toBe('Bearer');
    });

    it('throws UnauthorizedException on failure', async () => {
      fetchSpy.mockResolvedValue({ ok: false });

      await expect(service.refresh({ refresh_token: 'rt-expired' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ─── logout ─────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('calls Zitadel revocation endpoint', async () => {
      fetchSpy.mockResolvedValue({ ok: true });

      await service.logout('rt-to-revoke');

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, opts] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/oauth/v2/revocation');
      expect(opts.method).toBe('POST');
    });
  });

  // ─── reauthenticate ─────────────────────────────────────────────────────

  describe('reauthenticate', () => {
    it('returns reauth_token on success', async () => {
      // first call = login verify, second call should not happen
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(makeZitadelTokens()),
      });

      const result = await service.reauthenticate(mockUser as never, 'correct-pass');

      expect(result.reauth_token).toBeDefined();
      expect(result.expires_in).toBe(300);
      // token is base64url encoded
      const decoded = Buffer.from(result.reauth_token, 'base64url').toString();
      expect(decoded).toContain(mockUser.sub);
    });

    it('throws when login fails', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'invalid_grant' }),
      });

      await expect(service.reauthenticate(mockUser as never, 'wrong-pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
