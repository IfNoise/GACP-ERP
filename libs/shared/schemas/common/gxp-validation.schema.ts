/**
 * GxP Validation Fields Schema
 * Reusable mixin for standard GxP validation fields
 * Implements ALCOA+ principles
 */

import { z } from 'zod';

/**
 * GxP Validation Fields Schema - Mixin for ALCOA+ compliance
 * Used across all GxP-critical entities
 */
export const GxPValidationFieldsSchema = z.object({
  // Validation Status
  validation_status: z.enum([
    'not_validated',
    'validation_planned',
    'under_validation',
    'validated',
    'revalidation_required',
    'retired'
  ]).default('not_validated'),
  
  // Validation Protocol Reference
  validation_protocol_id: z.string().uuid().optional(),
  
  // Validation Report Reference
  validation_report_id: z.string().uuid().optional(),
  
  // Validation Date
  validated_at: z.coerce.date().optional(),
  
  // Validation Expiry (for periodic revalidation)
  validation_expires_at: z.coerce.date().optional(),
  
  // Next Revalidation Due Date
  next_revalidation_due: z.coerce.date().optional(),
  
  // Validation Responsible Person
  validated_by: z.string().uuid().optional(),
  
  // GxP Criticality Level
  gxp_criticality: z.enum(['non_gxp', 'gxp_related', 'gxp_critical']).default('gxp_related'),
  
  // ALCOA+ Compliance Flags
  alcoa_attributable: z.boolean().default(true),
  alcoa_legible: z.boolean().default(true),
  alcoa_contemporaneous: z.boolean().default(true),
  alcoa_original: z.boolean().default(true),
  alcoa_accurate: z.boolean().default(true),
  alcoa_complete: z.boolean().default(true),
  alcoa_consistent: z.boolean().default(true),
  alcoa_enduring: z.boolean().default(true),
  alcoa_available: z.boolean().default(true),
  
  // Traceability
  change_control_references: z.array(z.string().uuid()).default([]),
  deviation_references: z.array(z.string().uuid()).default([]),
  capa_references: z.array(z.string().uuid()).default([]),
  
  // Regulatory References
  regulatory_citations: z.array(z.string()).default([]),
  
  // Audit Trail Reference (mandatory for GxP)
  audit_trail_id: z.string().uuid()
});

/**
 * Type inference for GxP Validation Fields
 */
export type GxPValidationFields = z.infer<typeof GxPValidationFieldsSchema>;

/**
 * Helper function to merge GxP fields with other schemas
 */
export function withGxPValidation<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return schema.merge(GxPValidationFieldsSchema);
}

/**
 * Partial GxP Validation Fields (for updates)
 */
export const PartialGxPValidationFieldsSchema = GxPValidationFieldsSchema.partial();
