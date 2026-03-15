import { SetMetadata } from '@nestjs/common';
import type { SystemRole } from '@gacp-erp/shared-schemas';

// ─── Permission types ──────────────────────────────────────────────────────────

/**
 * Fine-grained resource:action permissions.
 * A role is granted access when it possesses at least one required permission.
 */
export type ResourceAction =
  | 'plants:read'
  | 'plants:create'
  | 'plants:update'
  | 'plants:delete'
  | 'plants:transition'
  | 'batches:read'
  | 'batches:create'
  | 'batches:update'
  | 'batches:harvest'
  | 'audit:read'
  | 'audit:verify'
  | 'signatures:create'
  | 'signatures:verify'
  | 'users:read'
  | 'users:manage'
  | 'config:read'
  | 'config:write';

// ─── Role → Permissions mapping ────────────────────────────────────────────────

/**
 * Declarative RBAC policy — role hierarchy reflected in permission sets.
 * Generated from: docs/compliance/SOP_AccessControl.md role matrix.
 */
export const ROLE_PERMISSIONS: Record<SystemRole, readonly ResourceAction[]> = {
  SUPER_ADMIN: [
    'plants:read',
    'plants:create',
    'plants:update',
    'plants:delete',
    'plants:transition',
    'batches:read',
    'batches:create',
    'batches:update',
    'batches:harvest',
    'audit:read',
    'audit:verify',
    'signatures:create',
    'signatures:verify',
    'users:read',
    'users:manage',
    'config:read',
    'config:write',
  ],
  QUALITY_MANAGER: [
    'plants:read',
    'plants:create',
    'plants:update',
    'plants:transition',
    'batches:read',
    'batches:create',
    'batches:update',
    'batches:harvest',
    'audit:read',
    'audit:verify',
    'signatures:create',
    'signatures:verify',
    'users:read',
    'config:read',
  ],
  CULTIVATION_MANAGER: [
    'plants:read',
    'plants:create',
    'plants:update',
    'plants:transition',
    'batches:read',
    'batches:create',
    'batches:update',
    'batches:harvest',
    'audit:read',
    'signatures:create',
    'config:read',
  ],
  OPERATOR: ['plants:read', 'plants:create', 'plants:update', 'plants:transition', 'batches:read'],
  AUDITOR: ['plants:read', 'batches:read', 'audit:read', 'audit:verify'],
  READONLY: ['plants:read', 'batches:read', 'audit:read'],
};

// ─── Decorator ─────────────────────────────────────────────────────────────────

export const PERMISSIONS_KEY = 'gacp_required_permissions' as const;

/**
 * Declares which fine-grained permissions are required for a route.
 * Must be used together with JwtAuthGuard + PermissionsGuard.
 *
 * Permission is GRANTED if the user holds at least one role that includes
 * ALL of the declared permissions (AND logic within the set,
 * OR logic across roles).
 *
 * @example
 * @UseGuards(JwtAuthGuard, PermissionsGuard)
 * @Permissions('plants:transition')
 * @Post(':id/transition')
 * transitionStage() { ... }
 */
export const Permissions = (...permissions: ResourceAction[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
