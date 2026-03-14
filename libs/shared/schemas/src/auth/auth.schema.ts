import { z } from 'zod';

import { SoftDeletableSchema } from '../common/base-entity.schema';
import { UserIdSchema } from '../common/branded-ids';

// ─── ROLES ───────────────────────────────────────────────────────────────────
/**
 * System roles, aligned with Keycloak realm roles in realm-export.json.
 * Role hierarchy: SUPER_ADMIN > QUALITY_MANAGER > CULTIVATION_MANAGER > OPERATOR > AUDITOR > READONLY
 */
export const SystemRoleEnum = z.enum([
  'SUPER_ADMIN',
  'QUALITY_MANAGER',
  'CULTIVATION_MANAGER',
  'OPERATOR',
  'AUDITOR',
  'READONLY',
]);
export type SystemRole = z.infer<typeof SystemRoleEnum>;

/** Roles that require TOTP MFA per security policy */
export const CRITICAL_ROLES: readonly SystemRole[] = ['SUPER_ADMIN', 'QUALITY_MANAGER'] as const;

/** Roles allowed to create electronic signatures */
export const SIGNATURE_ROLES: readonly SystemRole[] = [
  'SUPER_ADMIN',
  'QUALITY_MANAGER',
  'CULTIVATION_MANAGER',
] as const;

// ─── USER ────────────────────────────────────────────────────────────────────
export const UserSchema = SoftDeletableSchema.extend({
  id: UserIdSchema,
  /** Keycloak user ID (sub claim) */
  keycloak_id: z.string().uuid(),
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9_]+$/),
  email: z.string().email().toLowerCase(),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  roles: z.array(SystemRoleEnum).min(1),
  is_active: z.boolean().default(true),
  /** Whether MFA is configured and active */
  mfa_enabled: z.boolean().default(false),
  /** Last successful login timestamp */
  last_login_at: z.string().datetime({ offset: true }).nullable(),
  /** Number of failed login attempts since last success */
  failed_login_count: z.number().int().nonnegative().default(0),
  /** When account was locked (if locked) */
  locked_at: z.string().datetime({ offset: true }).nullable(),
  /** Staff employee identifier for physical access */
  employee_id: z.string().max(50).optional(),
});
export type User = z.infer<typeof UserSchema>;

export const UserPublicSchema = UserSchema.omit({
  keycloak_id: true,
  failed_login_count: true,
});
export type UserPublic = z.infer<typeof UserPublicSchema>;

// ─── JWT PAYLOAD ─────────────────────────────────────────────────────────────
/**
 * JWT access token payload as emitted by Keycloak.
 * Validated at runtime in AuthProvider and JwtStrategy.
 */
export const JwtPayloadSchema = z.object({
  /** Subject — Keycloak user ID */
  sub: z.string().uuid(),
  /** Expiration timestamp (unix seconds) */
  exp: z.number().int().positive(),
  /** Issued at (unix seconds) */
  iat: z.number().int().positive(),
  /** JWT ID */
  jti: z.string().optional(),
  /** Issuer — Keycloak realm URL */
  iss: z.string().url(),
  /** Audience */
  aud: z.string().or(z.array(z.string())).optional(),
  /** Keycloak realm access roles */
  realm_access: z.object({
    roles: z.array(z.string()),
  }),
  /** Preferred username */
  preferred_username: z.string(),
  email: z.string().email().optional(),
  email_verified: z.boolean().optional(),
  given_name: z.string().optional(),
  family_name: z.string().optional(),
  name: z.string().optional(),
  /** GACP-ERP internal user ID (injected by API gateway after lookup) */
  gacp_user_id: z.string().uuid().optional(),
});
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;

// ─── AUTH DTOs ───────────────────────────────────────────────────────────────
export const LoginRequestSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  /** TOTP code (required for CRITICAL_ROLES) */
  totp_code: z
    .string()
    .length(6)
    .regex(/^\d{6}$/)
    .optional(),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const TokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.literal('Bearer'),
  expires_in: z.number().int().positive(),
  refresh_expires_in: z.number().int().positive(),
  scope: z.string(),
});
export type TokenResponse = z.infer<typeof TokenResponseSchema>;

export const RefreshTokenRequestSchema = z.object({
  refresh_token: z.string().min(1),
});
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;

// ─── PERMISSION HELPER ───────────────────────────────────────────────────────
export const PermissionSchema = z.object({
  resource: z.string(),
  action: z.enum(['create', 'read', 'update', 'delete', 'approve', 'sign']),
  conditions: z.record(z.unknown()).optional(),
});
export type Permission = z.infer<typeof PermissionSchema>;
