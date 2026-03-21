import { createTestApp, type TestContext } from './helpers/create-test-app';
import { AuthService } from '../src/auth/auth.service';
import { authHeaders, createAdminPayload, createOperatorPayload } from './helpers/mock-jwt';

describe('Auth (E2E)', () => {
  let ctx: TestContext;
  let mockAuthService: {
    login: jest.Mock;
    refresh: jest.Mock;
    logout: jest.Mock;
    reauthenticate: jest.Mock;
  };

  beforeAll(async () => {
    mockAuthService = {
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
      reauthenticate: jest.fn(),
    };

    ctx = await createTestApp((builder) =>
      builder.overrideProvider(AuthService).useValue(mockAuthService),
    );
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────── POST /auth/login ────────────────────

  describe('POST /api/v1/auth/login', () => {
    it('returns tokens on valid credentials', async () => {
      mockAuthService.login.mockResolvedValue({
        access_token: 'at-123',
        refresh_token: 'rt-456',
        token_type: 'Bearer',
        expires_in: 300,
        refresh_expires_in: 1800,
        scope: 'openid profile',
      });

      const res = await ctx.app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { username: 'operator1', password: 'P@ssw0rd!' },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload) as { access_token: string };
      expect(body.access_token).toBe('at-123');
    });

    it('returns 400 when username is missing', async () => {
      const res = await ctx.app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { password: 'P@ssw0rd!' },
      });

      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when password is missing', async () => {
      const res = await ctx.app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { username: 'operator1' },
      });

      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when body is empty', async () => {
      const res = await ctx.app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {},
      });

      expect(res.statusCode).toBe(400);
    });
  });

  // ──────────────────── POST /auth/refresh ──────────────────

  describe('POST /api/v1/auth/refresh', () => {
    it('returns new tokens on valid refresh_token', async () => {
      mockAuthService.refresh.mockResolvedValue({
        access_token: 'at-new',
        refresh_token: 'rt-new',
        token_type: 'Bearer',
        expires_in: 300,
        refresh_expires_in: 1800,
        scope: 'openid profile',
      });

      const res = await ctx.app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload: { refresh_token: 'rt-old' },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload) as { access_token: string };
      expect(body.access_token).toBe('at-new');
    });

    it('returns 400 when refresh_token is missing', async () => {
      const res = await ctx.app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload: {},
      });

      expect(res.statusCode).toBe(400);
    });
  });

  // ──────────────────── GET /auth/me ────────────────────────

  describe('GET /api/v1/auth/me', () => {
    it('returns 401 without auth header', async () => {
      const res = await ctx.app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
      });

      expect(res.statusCode).toBe(401);
    });

    it('returns current user profile with auth', async () => {
      const user = createAdminPayload({
        email: 'admin@gacp.co',
        given_name: 'Test',
        family_name: 'Admin',
      });

      const res = await ctx.app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: authHeaders(user),
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload) as Record<string, unknown>;
      expect(body).toMatchObject({
        sub: user.sub,
        email: 'admin@gacp.co',
        preferred_username: 'test-admin',
        given_name: 'Test',
        family_name: 'Admin',
        roles: ['SUPER_ADMIN'],
      });
    });
  });

  // ──────────────────── POST /auth/logout ───────────────────

  describe('POST /api/v1/auth/logout', () => {
    it('returns 401 without auth', async () => {
      const res = await ctx.app.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
        payload: { refresh_token: 'rt-123' },
      });

      expect(res.statusCode).toBe(401);
    });

    it('returns 204 on successful logout', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);

      const res = await ctx.app.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
        headers: authHeaders(),
        payload: { refresh_token: 'rt-123' },
      });

      expect(res.statusCode).toBe(204);
      expect(mockAuthService.logout).toHaveBeenCalledWith('rt-123');
    });
  });

  // ──────────────────── POST /auth/reauth ───────────────────

  describe('POST /api/v1/auth/reauth', () => {
    it('returns 401 without auth', async () => {
      const res = await ctx.app.inject({
        method: 'POST',
        url: '/api/v1/auth/reauth',
        payload: { password: 'P@ssw0rd!' },
      });

      expect(res.statusCode).toBe(401);
    });

    it('returns reauth_token on valid re-authentication', async () => {
      const user = createOperatorPayload();
      mockAuthService.reauthenticate.mockResolvedValue({
        reauth_token: 'reauth-xyz-123',
        expires_in: 300,
      });

      const res = await ctx.app.inject({
        method: 'POST',
        url: '/api/v1/auth/reauth',
        headers: authHeaders(user),
        payload: { password: 'P@ssw0rd!' },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload) as { reauth_token: string };
      expect(body.reauth_token).toBe('reauth-xyz-123');
    });
  });
});
