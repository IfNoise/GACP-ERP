import { z } from 'zod';

import { BaseEntitySchema, ElectronicSignatureSchema } from '../common/base-entity.schema';
import { UserIdSchema } from '../common/branded-ids';

// ─── SUPPLIER ─────────────────────────────────────────────────────────────────

export const SupplierQualificationStatusEnum = z.enum(['QUALIFIED', 'PROVISIONAL', 'DISQUALIFIED']);
export type SupplierQualificationStatus = z.infer<typeof SupplierQualificationStatusEnum>;

/**
 * Supplier master record.
 * Qualification status per EU GMP Chapter 7 / WHO GACP §5.
 * Only QUALIFIED suppliers can appear in approved POs.
 */
export const SupplierSchema = BaseEntitySchema.extend({
  supplier_code: z.string().regex(/^SUP-\d{4}$/, {
    message: 'supplier_code must match SUP-NNNN',
  }),
  name: z.string().min(2).max(300),
  qualification_status: SupplierQualificationStatusEnum,
  /** ISO date — when qualification expires (must re-audit before this date) */
  qualification_expiry: z.string().date().nullable(),
  contact_details: z.object({
    email: z.string().email().nullable(),
    phone: z.string().max(30).nullable(),
    address: z.string().max(500).nullable(),
    contact_person: z.string().max(200).nullable(),
  }),
  is_active: z.boolean().default(true),
  notes: z.string().max(2000).nullable(),
});
export type Supplier = z.infer<typeof SupplierSchema>;

// ─── PURCHASE ORDER ───────────────────────────────────────────────────────────

export const PurchaseOrderStatusEnum = z.enum([
  'DRAFT',
  'SUBMITTED',
  'ACKNOWLEDGED',
  'RECEIVING',
  'CLOSED',
  'CANCELLED',
]);
export type PurchaseOrderStatus = z.infer<typeof PurchaseOrderStatusEnum>;

export const PO_TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['ACKNOWLEDGED', 'CANCELLED'],
  ACKNOWLEDGED: ['RECEIVING', 'CANCELLED'],
  RECEIVING: ['CLOSED', 'CANCELLED'],
  CLOSED: [],
  CANCELLED: [],
};

export const POLineSchema = z.object({
  id: z.string().uuid(),
  po_id: z.string().uuid(),
  line_number: z.number().int().positive(),
  item_description: z.string().min(3).max(500),
  quantity: z.number().positive(),
  unit_price: z.number().nonnegative(),
  unit_of_measure: z.string().min(1).max(20),
  /** Quantity received so far (updated during RECEIVING status) */
  received_quantity: z.number().nonnegative().default(0),
});
export type POLine = z.infer<typeof POLineSchema>;

/**
 * Purchase Order.
 * Workflow: DRAFT → SUBMITTED → ACKNOWLEDGED → RECEIVING → CLOSED
 * E-signature required at SUBMITTED → ACKNOWLEDGED transition.
 * Three-way match required before CLOSED (PO vs GRN vs Invoice).
 */
export const PurchaseOrderSchema = BaseEntitySchema.extend({
  po_number: z.string().regex(/^PO-\d{4}-\d{4}$/, {
    message: 'po_number must match PO-YYYY-NNNN',
  }),
  supplier_id: z.string().uuid(),
  status: PurchaseOrderStatusEnum,
  lines: z.array(POLineSchema).min(1),
  total_value: z.number().nonnegative(),
  currency: z.string().length(3).default('USD'),
  expected_delivery_date: z.string().date().nullable(),
  three_way_match_passed: z.boolean().nullable(),
  /** E-signature from authorizing manager (at SUBMITTED) */
  electronic_signature: ElectronicSignatureSchema.nullable(),
  notes: z.string().max(2000).nullable(),
});
export type PurchaseOrder = z.infer<typeof PurchaseOrderSchema>;

// ─── RECEIVING RECORD ─────────────────────────────────────────────────────────

export const ReceivingLineSchema = z.object({
  id: z.string().uuid(),
  receiving_record_id: z.string().uuid(),
  po_line_id: z.string().uuid(),
  quantity_received: z.number().positive(),
  condition_notes: z.string().max(500).nullable(),
});
export type ReceivingLine = z.infer<typeof ReceivingLineSchema>;

/**
 * Goods Receiving Note (GRN).
 * Records physical receipt of goods against a PO.
 */
export const ReceivingRecordSchema = BaseEntitySchema.extend({
  grn_number: z.string().regex(/^GRN-\d{4}-\d{4}$/, {
    message: 'grn_number must match GRN-YYYY-NNNN',
  }),
  po_id: z.string().uuid(),
  received_at: z.string().datetime({ offset: true }),
  received_by: UserIdSchema,
  lines: z.array(ReceivingLineSchema).min(1),
  quality_check_passed: z.boolean(),
  quality_check_notes: z.string().max(2000).nullable(),
  electronic_signature: ElectronicSignatureSchema,
});
export type ReceivingRecord = z.infer<typeof ReceivingRecordSchema>;

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export const CreateSupplierSchema = z.object({
  name: z.string().min(2).max(300),
  qualification_status: SupplierQualificationStatusEnum.optional(),
  qualification_expiry: z.string().date().optional(),
  contact_details: z
    .object({
      email: z.string().email().optional(),
      phone: z.string().max(30).optional(),
      address: z.string().max(500).optional(),
      contact_person: z.string().max(200).optional(),
    })
    .optional(),
  notes: z.string().max(2000).optional(),
});
export type CreateSupplier = z.infer<typeof CreateSupplierSchema>;

export const CreatePurchaseOrderSchema = z.object({
  supplier_id: z.string().uuid(),
  lines: z
    .array(
      z.object({
        item_description: z.string().min(3).max(500),
        quantity: z.number().positive(),
        unit_price: z.number().nonnegative(),
        unit_of_measure: z.string().min(1).max(20),
      }),
    )
    .min(1),
  currency: z.string().length(3).optional(),
  expected_delivery_date: z.string().date().optional(),
  notes: z.string().max(2000).optional(),
});
export type CreatePurchaseOrder = z.infer<typeof CreatePurchaseOrderSchema>;

export const SubmitPurchaseOrderSchema = z.object({
  electronic_signature: ElectronicSignatureSchema,
});
export type SubmitPurchaseOrder = z.infer<typeof SubmitPurchaseOrderSchema>;

export const ReceiveGoodsSchema = z.object({
  lines: z
    .array(
      z.object({
        po_line_id: z.string().uuid(),
        quantity_received: z.number().positive(),
        condition_notes: z.string().max(500).optional(),
      }),
    )
    .min(1),
  quality_check_passed: z.boolean(),
  quality_check_notes: z.string().max(2000).optional(),
  electronic_signature: ElectronicSignatureSchema,
});
export type ReceiveGoods = z.infer<typeof ReceiveGoodsSchema>;
