import { UnauthorizedException } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockConfig: Record<string, string> = {
  ZITADEL_URL: 'http://zitadel:8080',
  ZITADEL_API_GW_CLIENT_ID: 'api-gateway',
  ZITADEL_API_GW_CLIENT_SECRET: 'secret',
  ZITADEL_PROJECT_ID: 'test-project-id',
  ZITADEL_ADMIN_PAT: 'admin-pat-token',
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
  sub: '00000000-0000-0000-0000-000000000001',
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
    it('calls Zitadel Session API v2 with userId and password', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ sessionId: 'sess-001', sessionToken: 'st-abc' }),
      });

      await service.reauthenticate(mockUser as never, 'correct-pass');

      const [url, opts] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('http://zitadel:8080/v2/sessions');
      expect(opts.method).toBe('POST');
      const body = JSON.parse(opts.body as string) as Record<string, unknown>;
      expect(body).toMatchObject({
        checks: {
          user: { userId: mockUser.sub },
          password: { password: 'correct-pass' },
        },
      });
    });

    it('returns reauth_token on success', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ sessionId: 'sess-001', sessionToken: 'st-abc' }),
      });

      const result = await service.reauthenticate(mockUser as never, 'correct-pass');

      expect(result.reauth_token).toBeDefined();
      expect(result.expires_in).toBe(300);
      const decoded = Buffer.from(result.reauth_token, 'base64url').toString();
      expect(decoded).toContain(mockUser.sub);
    });

    it('throws UnauthorizedException when session creation fails', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ code: 16, message: 'invalid password' }),
      });

      await expect(service.reauthenticate(mockUser as never, 'wrong-pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
