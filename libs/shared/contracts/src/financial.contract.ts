import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import {
  ApiErrorSchema,
  PaginationQuerySchema,
  AccountSchema,
  CreateAccountSchema,
  JournalEntrySchema,
  CreateJournalEntrySchema,
  BiologicalAssetSchema,
  RecordBiologicalAssetValuationSchema,
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
 * Financial Operations API contract (EPIC 8).
 *
 * Covers Chart of Accounts, Journal Entries (IAS/IFRS double-entry),
 * Biological Asset Valuations (IAS 41), and Cost Allocations.
 */
export const financialContract = c.router({
  // ── Chart of Accounts ────────────────────────────────────────────────────

  createAccount: {
    method: 'POST',
    path: '/financial/accounts',
    body: CreateAccountSchema,
    responses: {
      201: AccountSchema,
      400: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Create a ledger account',
  },

  listAccounts: {
    method: 'GET',
    path: '/financial/accounts',
    query: PaginationQuerySchema.extend({
      account_type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']).optional(),
      is_active: z
        .string()
        .transform((v) => v === 'true')
        .optional(),
    }),
    responses: {
      200: paginatedList(AccountSchema),
    },
    summary: 'List ledger accounts',
  },

  getAccount: {
    method: 'GET',
    path: '/financial/accounts/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: AccountSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get a ledger account by ID',
  },

  // ── Journal Entries ───────────────────────────────────────────────────────

  createJournalEntry: {
    method: 'POST',
    path: '/financial/journal-entries',
    body: CreateJournalEntrySchema,
    responses: {
      201: JournalEntrySchema,
      400: ApiErrorSchema,
    },
    summary: 'Create a journal entry (DRAFT)',
  },

  postJournalEntry: {
    method: 'POST',
    path: '/financial/journal-entries/:id/post',
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
      200: JournalEntrySchema,
      400: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Post (confirm) a journal entry with e-signature',
  },

  reverseJournalEntry: {
    method: 'POST',
    path: '/financial/journal-entries/:id/reverse',
    pathParams: z.object({ id: z.string().uuid() }),
    body: z.object({
      reason: z.string().min(1),
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
      200: JournalEntrySchema,
      400: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Reverse a posted journal entry',
  },

  getJournalEntry: {
    method: 'GET',
    path: '/financial/journal-entries/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: JournalEntrySchema,
      404: ApiErrorSchema,
    },
    summary: 'Get a journal entry by ID',
  },

  listJournalEntries: {
    method: 'GET',
    path: '/financial/journal-entries',
    query: PaginationQuerySchema.extend({
      status: z.enum(['DRAFT', 'POSTED', 'REVERSED']).optional(),
    }),
    responses: {
      200: paginatedList(JournalEntrySchema),
    },
    summary: 'List journal entries',
  },

  // ── Biological Asset Valuations (IAS 41) ─────────────────────────────────

  recordBiologicalAssetValuation: {
    method: 'POST',
    path: '/financial/biological-assets/valuations',
    body: RecordBiologicalAssetValuationSchema,
    responses: {
      201: BiologicalAssetSchema,
      400: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'Record a biological asset valuation (IAS 41)',
  },

  getLatestBiologicalAssetValuation: {
    method: 'GET',
    path: '/financial/biological-assets/:batchId',
    pathParams: z.object({ batchId: z.string().uuid() }),
    responses: {
      200: BiologicalAssetSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get latest biological asset valuation for a batch',
  },
});
