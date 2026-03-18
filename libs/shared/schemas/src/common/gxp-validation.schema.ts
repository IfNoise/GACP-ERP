import { z } from 'zod';

// ─── GXP VALIDATION FIELDS MIXIN ─────────────────────────────────────────────
/**
 * GxP Validation Fields — required on all quality-critical records.
 *
 * Implements GAMP 5 / EU GMP Annex 11 §4.8 requirements for validated records:
 *   - Every quality record must declare its validation status
 *   - Retention classes enforce regulatory retention periods
 *   - audit_tx_id links to the ImmuDB transaction for immutability proof
 */

/**
 * Validation status lifecycle per GAMP 5 Category matrix.
 *  - unvalidated  : newly created, not yet formally assessed
 *  - validated    : passed IQ/OQ/PQ protocol
 *  - under_review : periodic review in progress
 *  - superseded   : replaced by a newer version, kept for historical traceability
 */
export const ValidationStatusEnum = z.enum([
  'unvalidated',
  'validated',
  'under_review',
  'superseded',
]);
export type ValidationStatus = z.infer<typeof ValidationStatusEnum>;

/**
 * Retention class per EU GMP Annex 11 §17 and 21 CFR Part 211.180.
 *  - PERMANENT  : Batch records, validation protocols — keep indefinitely
 *  - 7_YEAR     : Standard GMP records (≥ 1 year after expiry + 7 years)
 *  - 30_YEAR    : Investigational product records
 */
export const QualityRetentionClassEnum = z.enum(['PERMANENT', '7_YEAR', '30_YEAR']);
export type QualityRetentionClass = z.infer<typeof QualityRetentionClassEnum>;

/**
 * GxP Validation Fields Mixin.
 *
 * Extend any quality schema with `.merge(GxpValidationFieldsSchema)` to
 * add full GxP metadata required for regulatory compliance.
 *
 * @example
 * export const ChangeControlSchema = BaseEntitySchema
 *   .extend({ ... })
 *   .merge(GxpValidationFieldsSchema);
 */
export const GxpValidationFieldsSchema = z.object({
  /** Current validation status per GAMP 5 lifecycle */
  validation_status: ValidationStatusEnum,
  /** FK to validation_protocols.id — identifies the IQ/OQ/PQ that validated this record */
  validation_protocol_id: z.string().uuid().nullable(),
  /** ISO 8601 UTC timestamp of last formal validation */
  last_validated_at: z.string().datetime({ offset: true }).nullable(),
  /** ISO 8601 date (YYYY-MM-DD) — next mandatory periodic review */
  next_review_date: z.string().date().nullable(),
  /** Regulatory retention class — governs record archive and deletion policies */
  retention_class: QualityRetentionClassEnum,
  /**
   * ImmuDB transaction ID for immutability proof.
   * Written after the first approved state-change signature.
   * Null until the record reaches its first critical workflow milestone.
   * (ALCOA+: Enduring — proof of immutability)
   */
  audit_tx_id: z.string().max(200).nullable(),
});

export type GxpValidationFields = z.infer<typeof GxpValidationFieldsSchema>;
