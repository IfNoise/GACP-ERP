import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type JwtPayload, type SystemRole } from '@gacp-erp/shared-schemas';
import {
  PERMISSIONS_KEY,
  ROLE_PERMISSIONS,
  type ResourceAction,
} from '../../common/decorators/permissions.decorator';

/**
 * Fine-grained permissions guard.
 *
 * Resolves the set of required permissions from the @Permissions() decorator,
 * then checks whether the authenticated user's roles collectively grant ALL
 * of those permissions (i.e. each required permission is covered by at least
 * one of the user's roles — AND-over-permissions, OR-over-roles).
 *
 * Must be used AFTER JwtAuthGuard so that `request.user` is populated.
 *
 * @see {@link Permissions}
 *
 * @example
 * @UseGuards(JwtAuthGuard, PermissionsGuard)
 * @Permissions('plants:transition')
 * async transitionStage() { ... }
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<ResourceAction[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Permissions() decorator — route is open to all authenticated users
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No authentication context');
    }

    const userRoles: SystemRole[] = (user.realm_access?.roles ?? []) as SystemRole[];

    // Build effective permission set — union of all role permissions
    const effectivePermissions = new Set<ResourceAction>();
    for (const role of userRoles) {
      const granted = ROLE_PERMISSIONS[role];
      if (granted) {
        for (const p of granted) {
          effectivePermissions.add(p);
        }
      }
    }

    // Every required permission must be in the effective set
    const missing = required.filter((p) => !effectivePermissions.has(p));

    if (missing.length > 0) {
      throw new ForbiddenException(
        `Missing permissions: [${missing.join(', ')}]. ` + `User roles: [${userRoles.join(', ')}]`,
      );
    }

    return true;
  }
}
