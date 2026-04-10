import { AuthController } from './auth.controller';
import { type AuthService } from './auth.service';

// ─── Mock AuthService ─────────────────────────────────────────────────────────

function makeAuthService(): jest.Mocked<AuthService> {
  return {
    refresh: jest.fn(),
    logout: jest.fn(),
    reauthenticate: jest.fn(),
  } as unknown as jest.Mocked<AuthService>;
}

const mockUser = {
  sub: 'u-1',
  email: 'jane@test.com',
  preferred_username: 'jane.doe',
  given_name: 'Jane',
  family_name: 'Doe',
  realm_access: { roles: ['OPERATOR'] },
  iat: 1000,
  exp: 2000,
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(() => {
    authService = makeAuthService();
    controller = new AuthController(authService as never);
  });

  it('refresh delegates to authService.refresh', async () => {
    const dto = { refresh_token: 'rt-old' };
    const tokens = {
      access_token: 'at',
      refresh_token: 'rt',
      expires_in: 300,
      refresh_expires_in: 1800,
      token_type: 'Bearer' as const,
      scope: '',
    };
    authService.refresh.mockResolvedValue(tokens);

    const result = await controller.refresh(dto);
    expect(result).toEqual(tokens);
  });

  it('logout delegates to authService.logout', async () => {
    authService.logout.mockResolvedValue(undefined);
    await controller.logout({ refresh_token: 'rt' });
    expect(authService.logout).toHaveBeenCalledWith('rt');
  });

  it('me returns user profile', () => {
    const result = controller.me(mockUser as never);
    expect(result).toEqual({
      sub: 'u-1',
      email: 'jane@test.com',
      preferred_username: 'jane.doe',
      given_name: 'Jane',
      family_name: 'Doe',
      roles: ['OPERATOR'],
    });
  });

  it('me returns empty roles when realm_access is missing', () => {
    const user = { ...mockUser, realm_access: undefined };
    const result = controller.me(user as never);
    expect(result.roles).toEqual([]);
  });

  it('reauthenticate delegates to authService.reauthenticate', async () => {
    authService.reauthenticate.mockResolvedValue({ reauth_token: 'tok', expires_in: 300 });
    const result = await controller.reauthenticate(mockUser as never, { password: 'pass' });
    expect(result).toEqual({ reauth_token: 'tok', expires_in: 300 });
    expect(authService.reauthenticate).toHaveBeenCalledWith(mockUser, 'pass');
  });
});
