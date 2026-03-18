import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import {
  ApiErrorSchema,
  PaginationQuerySchema,
  SupplierSchema,
  CreateSupplierSchema,
  PurchaseOrderSchema,
  CreatePurchaseOrderSchema,
  SubmitPurchaseOrderSchema,
  ReceiveGoodsSchema,
} from '@gacp-erp/shared-schemas';

const c = initContract();

function paginatedList<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
  });
}

/**
 * Procurement API contract (EPIC 8).
 *
 * Covers Supplier Management, Purchase Orders with state-machine workflow
 * (DRAFT → SUBMITTED → ACKNOWLEDGED → RECEIVING → CLOSED), GRN receiving,
 * and three-way match (PO ↔ GRN ↔ Invoice).
 */
export const procurementContract = c.router({
  // ── Suppliers ─────────────────────────────────────────────────────────────

  createSupplier: {
    method: 'POST',
    path: '/procurement/suppliers',
    body: CreateSupplierSchema,
    responses: {
      201: SupplierSchema,
      400: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Register a new supplier (starts as PROVISIONAL)',
  },

  listSuppliers: {
    method: 'GET',
    path: '/procurement/suppliers',
    query: PaginationQuerySchema.extend({
      qualification_status: z.enum(['QUALIFIED', 'PROVISIONAL', 'DISQUALIFIED']).optional(),
      is_active: z
        .string()
        .transform((v) => v === 'true')
        .optional(),
    }),
    responses: {
      200: paginatedList(SupplierSchema),
    },
    summary: 'List suppliers',
  },

  getSupplier: {
    method: 'GET',
    path: '/procurement/suppliers/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: SupplierSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get supplier by ID',
  },

  qualifySupplier: {
    method: 'PATCH',
    path: '/procurement/suppliers/:id/qualify',
    pathParams: z.object({ id: z.string().uuid() }),
    body: z.object({
      qualification_status: z.enum(['QUALIFIED', 'PROVISIONAL', 'DISQUALIFIED']),
      qualification_expiry: z.string().datetime().optional(),
      notes: z.string().optional(),
    }),
    responses: {
      200: SupplierSchema,
      400: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'Update supplier qualification status',
  },

  // ── Purchase Orders ───────────────────────────────────────────────────────

  createPurchaseOrder: {
    method: 'POST',
    path: '/procurement/purchase-orders',
    body: CreatePurchaseOrderSchema,
    responses: {
      201: PurchaseOrderSchema,
      400: ApiErrorSchema,
    },
    summary: 'Create a purchase order (DRAFT)',
  },

  getPurchaseOrder: {
    method: 'GET',
    path: '/procurement/purchase-orders/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: PurchaseOrderSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get purchase order by ID',
  },

  listPurchaseOrders: {
    method: 'GET',
    path: '/procurement/purchase-orders',
    query: PaginationQuerySchema.extend({
      status: z
        .enum(['DRAFT', 'SUBMITTED', 'ACKNOWLEDGED', 'RECEIVING', 'CLOSED', 'CANCELLED'])
        .optional(),
      supplier_id: z.string().uuid().optional(),
    }),
    responses: {
      200: paginatedList(PurchaseOrderSchema),
    },
    summary: 'List purchase orders',
  },

  submitPurchaseOrder: {
    method: 'POST',
    path: '/procurement/purchase-orders/:id/submit',
    pathParams: z.object({ id: z.string().uuid() }),
    body: SubmitPurchaseOrderSchema,
    responses: {
      200: PurchaseOrderSchema,
      400: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Submit PO for supplier acknowledgement (DRAFT → SUBMITTED)',
  },

  acknowledgePurchaseOrder: {
    method: 'POST',
    path: '/procurement/purchase-orders/:id/acknowledge',
    pathParams: z.object({ id: z.string().uuid() }),
    body: z.object({ notes: z.string().optional() }),
    responses: {
      200: PurchaseOrderSchema,
      400: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Acknowledge a submitted PO (SUBMITTED → ACKNOWLEDGED)',
  },

  receiveGoods: {
    method: 'POST',
    path: '/procurement/purchase-orders/:id/receive-goods',
    pathParams: z.object({ id: z.string().uuid() }),
    body: ReceiveGoodsSchema,
    responses: {
      200: PurchaseOrderSchema,
      400: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Record goods receipt (GRN) — moves PO to RECEIVING',
  },

  closePurchaseOrder: {
    method: 'POST',
    path: '/procurement/purchase-orders/:id/close',
    pathParams: z.object({ id: z.string().uuid() }),
    body: z.object({
      electronic_signature: z.object({
        signed_by: z.string().uuid(),
        signer_name: z.string().min(1),
        signer_role: z.string().min(1),
        signature_type: z.literal('ELECTRONIC'),
        authentication_method: z.enum(['PASSWORD', 'MFA', 'BIOMETRIC', 'SMART_CARD']),
        digital_signature: z.string().min(1),
        content_hash: z.string().min(1),
        ip_address: z.string().ip(),
        workstation_id: z.string().min(1),
        signature_meaning: z.string().min(1),
        signed_at: z.string().datetime(),
      }),
    }),
    responses: {
      200: PurchaseOrderSchema,
      400: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Close PO after three-way match (RECEIVING → CLOSED)',
  },

  cancelPurchaseOrder: {
    method: 'POST',
    path: '/procurement/purchase-orders/:id/cancel',
    pathParams: z.object({ id: z.string().uuid() }),
    body: z.object({ reason: z.string().min(1) }),
    responses: {
      200: PurchaseOrderSchema,
      400: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Cancel a purchase order',
  },
});
