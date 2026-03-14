import { z } from 'zod';

import { UserIdSchema } from './branded-ids';

// ─── BASE ENTITY ─────────────────────────────────────────────────────────────
/**
 * Base schema for all persisted entities.
 * Every entity must have these audit fields (ALCOA+: Attributable, Contemporaneous).
 */
export const BaseEntitySchema = z.object({
  /** Unique entity identifier (UUID v4) */
  id: z.string().uuid(),
  /** ISO 8601 UTC timestamp — when the record was created */
  created_at: z.string().datetime({ offset: true }),
  /** ISO 8601 UTC timestamp — when the record was last updated */
  updated_at: z.string().datetime({ offset: true }),
  /** User ID who created this record (Attributable — ALCOA+) */
  created_by: UserIdSchema,
  /** User ID who last updated this record (Attributable — ALCOA+) */
  updated_by: UserIdSchema,
});

export type BaseEntity = z.infer<typeof BaseEntitySchema>;

// ─── SOFT DELETE ─────────────────────────────────────────────────────────────
/**
 * Extension for entities that support soft deletion.
 * Regulatory data must never be hard-deleted (21 CFR Part 11 §11.10(e)).
 */
export const SoftDeletableSchema = BaseEntitySchema.extend({
  /** ISO 8601 UTC timestamp — when the record was soft-deleted */
  deleted_at: z.string().datetime({ offset: true }).nullable(),
  /** User ID who soft-deleted this record */
  deleted_by: UserIdSchema.nullable(),
  /** Whether this record is soft-deleted */
  is_deleted: z.boolean().default(false),
});

export type SoftDeletable = z.infer<typeof SoftDeletableSchema>;

// ─── ELECTRONIC SIGNATURE (21 CFR Part 11 §11.50 / §11.70 / §11.200) ────────
/**
 * Electronic signature schema per 21 CFR Part 11 §11.50.
 * Required for critical actions: batch approval, harvest confirmation,
 * QC release, config changes.
 */
export const SignatureTypeSchema = z.enum([
  'approval',
  'review',
  'verification',
  'witnessed',
  'authorization',
]);
export type SignatureType = z.infer<typeof SignatureTypeSchema>;

export const AuthenticationMethodSchema = z.enum([
  'password',
  'biometric',
  'token',
  'two_factor',
  'pki_certificate',
]);
export type AuthenticationMethod = z.infer<typeof AuthenticationMethodSchema>;

export const ElectronicSignatureSchema = z.object({
  /** User who signed (UUID) */
  signed_by: UserIdSchema,
  /** User's full legal name at time of signature */
  signer_name: z.string().min(1).max(200),
  /** User's role at time of signature */
  signer_role: z.string().min(1).max(100),
  /** Purpose/meaning of the signature (21 CFR §11.50(a)) */
  signature_type: SignatureTypeSchema,
  /** How the user authenticated (21 CFR §11.200) */
  authentication_method: AuthenticationMethodSchema,
  /** RSA-SHA256 digital signature of the payload (hex) */
  digital_signature: z.string().regex(/^[0-9a-f]{256,}$/i, {
    message: 'digital_signature must be a hex-encoded RSA-SHA256 signature',
  }),
  /** SHA-256 hash of the signed content */
  content_hash: z.string().regex(/^[0-9a-f]{64}$/i, {
    message: 'content_hash must be a 64-char hex SHA-256',
  }),
  /** IP address of the workstation (Attributable — ALCOA+) */
  ip_address: z.string().ip(),
  /** Workstation identifier */
  workstation_id: z.string().min(1).max(100),
  /** Meaning of the signature in context (21 CFR §11.50(a)(2)) */
  signature_meaning: z.string().min(1).max(500),
  /** ISO 8601 UTC timestamp of when the signature was captured */
  signed_at: z.string().datetime({ offset: true }),
});

export type ElectronicSignature = z.infer<typeof ElectronicSignatureSchema>;

// ─── PAGINATION ──────────────────────────────────────────────────────────────
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export function PaginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
  });
}

// ─── DATE RANGE ──────────────────────────────────────────────────────────────
export const DateRangeSchema = z
  .object({
    from: z.string().datetime({ offset: true }),
    to: z.string().datetime({ offset: true }),
  })
  .refine((d) => new Date(d.from) <= new Date(d.to), {
    message: '`from` must be before or equal to `to`',
    path: ['from'],
  });

export type DateRange = z.infer<typeof DateRangeSchema>;
