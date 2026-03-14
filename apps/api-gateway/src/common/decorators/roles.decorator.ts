import { SetMetadata } from '@nestjs/common';
import type { SystemRole } from '@gacp-erp/shared-schemas';

export const ROLES_KEY = 'gacp_required_roles' as const;

/**
 * Declares which SystemRoles are allowed to call this route.
 * Must be used together with JwtAuthGuard + RolesGuard.
 *
 * @example
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles('QUALITY_MANAGER', 'SUPER_ADMIN')
 * @Get('sensitive')
 * getSensitiveData() { ... }
 */
export const Roles = (...roles: SystemRole[]) => SetMetadata(ROLES_KEY, roles);
