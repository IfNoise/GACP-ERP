import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import type { JwtPayload } from '@gacp-erp/shared-schemas';

function makeContext(user: Partial<JwtPayload> | null): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  describe('when no @Roles() decorator is present', () => {
    it('returns true (route open)', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined as never);
      expect(guard.canActivate(makeContext(null))).toBe(true);
    });

    it('returns true for empty roles array', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([] as never);
      expect(guard.canActivate(makeContext(null))).toBe(true);
    });
  });

  describe('when @Roles() is present but user is missing', () => {
    it('throws ForbiddenException', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['OPERATOR'] as never);
      expect(() => guard.canActivate(makeContext(null))).toThrow(ForbiddenException);
      expect(() => guard.canActivate(makeContext(null))).toThrow('No authentication context');
    });
  });

  describe('user has the required role', () => {
    it('returns true for exact role match', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['OPERATOR'] as never);
      const ctx = makeContext({ sub: 'u1', realm_access: { roles: ['OPERATOR'] } });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('returns true when user has one of the required roles', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['OPERATOR', 'QUALITY_MANAGER'] as never);
      const ctx = makeContext({ sub: 'u2', realm_access: { roles: ['QUALITY_MANAGER'] } });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('returns true for SUPER_ADMIN when any role is required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['SUPER_ADMIN'] as never);
      const ctx = makeContext({ sub: 'u3', realm_access: { roles: ['SUPER_ADMIN'] } });
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('user does NOT have the required role', () => {
    it('throws ForbiddenException with descriptive message', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['QUALITY_MANAGER'] as never);
      const ctx = makeContext({ sub: 'u4', realm_access: { roles: ['READONLY'] } });

      let error: ForbiddenException | undefined;
      try {
        guard.canActivate(ctx);
      } catch (e) {
        error = e as ForbiddenException;
      }

      expect(error).toBeDefined();
      expect(error!.message).toContain('QUALITY_MANAGER');
      expect(error!.message).toContain('READONLY');
    });

    it('throws when user has empty roles array', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['OPERATOR'] as never);
      const ctx = makeContext({ sub: 'u5', realm_access: { roles: [] } });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });

  describe('user with no realm_access property', () => {
    it('throws ForbiddenException when realm_access is undefined', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['OPERATOR'] as never);
      const ctx = makeContext({ sub: 'u6' });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });
});
