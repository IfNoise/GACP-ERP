import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';
import type { JwtPayload } from '@gacp-erp/shared-schemas';

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  describe('when no @Permissions() decorator is present', () => {
    it('returns true (route open to all authenticated users)', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined as never);
      const ctx = {
        switchToHttp: () => ({ getRequest: () => ({ user: null }) }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('returns true for empty permissions array', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([] as never);
      const ctx = {
        switchToHttp: () => ({ getRequest: () => ({ user: null }) }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('when @Permissions() is present but user is missing', () => {
    it('throws ForbiddenException with "No authentication context"', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['plants:read'] as never);
      const ctx = {
        switchToHttp: () => ({ getRequest: () => ({ user: null }) }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(ctx)).toThrow(
        new ForbiddenException('No authentication context'),
      );
    });
  });

  describe('SUPER_ADMIN role', () => {
    const user: Partial<JwtPayload> = {
      sub: 'user-1',
      realm_access: { roles: ['SUPER_ADMIN'] },
    };

    it.each([
      'plants:read',
      'plants:create',
      'plants:delete',
      'plants:transition',
      'batches:harvest',
      'users:manage',
      'config:write',
      'audit:verify',
    ])('grants %s', (required) => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([required] as never);
      const ctx = {
        switchToHttp: () => ({ getRequest: () => ({ user }) }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('grants all permissions simultaneously', () => {
      const allPerms = [
        'plants:read',
        'plants:create',
        'users:manage',
        'config:write',
        'audit:verify',
      ];
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(allPerms as never);
      const ctx = {
        switchToHttp: () => ({ getRequest: () => ({ user }) }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('READONLY role', () => {
    const user: Partial<JwtPayload> = {
      sub: 'user-2',
      realm_access: { roles: ['READONLY'] },
    };

    it('grants plants:read', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['plants:read'] as never);
      const ctx = {
        switchToHttp: () => ({ getRequest: () => ({ user }) }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('denies plants:create', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['plants:create'] as never);
      const ctx = {
        switchToHttp: () => ({ getRequest: () => ({ user }) }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('denies users:manage', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['users:manage'] as never);
      const ctx = {
        switchToHttp: () => ({ getRequest: () => ({ user }) }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('denies config:write', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['config:write'] as never);
      const ctx = {
        switchToHttp: () => ({ getRequest: () => ({ user }) }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });

  describe('AUDITOR role', () => {
    const user: Partial<JwtPayload> = {
      sub: 'user-3',
      realm_access: { roles: ['AUDITOR'] },
    };

    it('grants audit:read and audit:verify', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['audit:read', 'audit:verify'] as never);
      const ctx = {
        switchToHttp: () => ({ getRequest: () => ({ user }) }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('denies plants:create', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['plants:create'] as never);
      const ctx = {
        switchToHttp: () => ({ getRequest: () => ({ user }) }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });

  describe('role union (multiple roles)', () => {
    it('grants permission if ANY role covers it', () => {
      const user: Partial<JwtPayload> = {
        sub: 'user-4',
        realm_access: { roles: ['READONLY', 'AUDITOR'] },
      };
      // READONLY has plants:read, AUDITOR has audit:read — together they cover both
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['plants:read', 'audit:read'] as never);
      const ctx = {
        switchToHttp: () => ({ getRequest: () => ({ user }) }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('denies when combined roles still miss required permission', () => {
      const user: Partial<JwtPayload> = {
        sub: 'user-5',
        realm_access: { roles: ['READONLY', 'AUDITOR'] },
      };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['config:write'] as never);
      const ctx = {
        switchToHttp: () => ({ getRequest: () => ({ user }) }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });

  describe('error message', () => {
    it('includes missing permission names and user roles in the message', () => {
      const user: Partial<JwtPayload> = {
        sub: 'user-6',
        realm_access: { roles: ['READONLY'] },
      };
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['plants:delete', 'config:write'] as never);
      const ctx = {
        switchToHttp: () => ({ getRequest: () => ({ user }) }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      let thrown: ForbiddenException | undefined;
      try {
        guard.canActivate(ctx);
      } catch (e) {
        thrown = e as ForbiddenException;
      }

      expect(thrown).toBeDefined();
      const message = thrown!.message;
      expect(message).toContain('plants:delete');
      expect(message).toContain('config:write');
      expect(message).toContain('READONLY');
    });
  });
});
