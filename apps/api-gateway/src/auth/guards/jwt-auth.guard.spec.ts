import { type ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard — dev mode (AUTH_MODE=dev)', () => {
  const originalAuthMode = process.env['AUTH_MODE'];
  const originalNodeEnv = process.env['NODE_ENV'];

  beforeAll(() => {
    process.env['AUTH_MODE'] = 'dev';
    process.env['NODE_ENV'] = 'test';
  });

  afterAll(() => {
    process.env['AUTH_MODE'] = originalAuthMode;
    process.env['NODE_ENV'] = originalNodeEnv;
  });

  it('is defined', () => {
    expect(new JwtAuthGuard()).toBeDefined();
  });

  it('defaults to SUPER_ADMIN when x-dev-user header is absent', () => {
    const guard = new JwtAuthGuard();
    const req: Record<string, unknown> = { headers: {} };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;

    const result = guard.canActivate(ctx);

    expect(result).toBe(true);
    expect((req['user'] as { realm_access: { roles: string[] } }).realm_access.roles).toEqual([
      'SUPER_ADMIN',
    ]);
  });

  it.each([
    ['SUPER_ADMIN', '00000000-0000-0000-0000-000000000001'],
    ['QUALITY_MANAGER', '00000000-0000-0000-0000-000000000002'],
    ['CULTIVATION_MANAGER', '00000000-0000-0000-0000-000000000003'],
    ['OPERATOR', '00000000-0000-0000-0000-000000000004'],
    ['AUDITOR', '00000000-0000-0000-0000-000000000005'],
    ['READONLY', '00000000-0000-0000-0000-000000000006'],
  ])('maps x-dev-user: %s to correct sub and role', (role, expectedSub) => {
    const guard = new JwtAuthGuard();
    const req: Record<string, unknown> = { headers: { 'x-dev-user': role } };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;

    guard.canActivate(ctx);

    const user = req['user'] as { sub: string; realm_access: { roles: string[] } };
    expect(user.sub).toBe(expectedSub);
    expect(user.realm_access.roles).toContain(role);
  });

  it('falls back to SUPER_ADMIN for unknown role header', () => {
    const guard = new JwtAuthGuard();
    const req: Record<string, unknown> = { headers: { 'x-dev-user': 'UNKNOWN_ROLE' } };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;
    guard.canActivate(ctx);
    expect((req['user'] as { realm_access: { roles: string[] } }).realm_access.roles).toEqual([
      'SUPER_ADMIN',
    ]);
  });
});

describe('JwtAuthGuard — production safety', () => {
  const originalAuthMode = process.env['AUTH_MODE'];
  const originalNodeEnv = process.env['NODE_ENV'];

  afterEach(() => {
    process.env['AUTH_MODE'] = originalAuthMode;
    process.env['NODE_ENV'] = originalNodeEnv;
  });

  it('throws when AUTH_MODE=dev in production', () => {
    process.env['AUTH_MODE'] = 'dev';
    process.env['NODE_ENV'] = 'production';
    expect(() => new JwtAuthGuard()).toThrow('AUTH_MODE=dev is forbidden in production');
  });
});

describe('JwtAuthGuard — normal mode', () => {
  const originalAuthMode = process.env['AUTH_MODE'];

  beforeAll(() => {
    delete process.env['AUTH_MODE'];
  });

  afterAll(() => {
    process.env['AUTH_MODE'] = originalAuthMode;
  });

  it('is defined and extends AuthGuard', () => {
    const guard = new JwtAuthGuard();
    expect(guard).toBeDefined();
    expect(guard.canActivate).toBeDefined();
  });

  it('does not attach user directly (passport handles it)', async () => {
    const guard = new JwtAuthGuard();
    const req = { headers: {} };
    // In normal mode canActivate delegates to passport which rejects (no JWT) — that's expected.
    // We only verify the guard does NOT short-circuit by setting req.user itself.
    try {
      await guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => req,
          getResponse: () => ({}),
        }),
      } as unknown as ExecutionContext);
    } catch {
      // passport throws when strategy not registered in unit test — expected
    }
    expect((req as Record<string, unknown>)['user']).toBeUndefined();
  });
});
