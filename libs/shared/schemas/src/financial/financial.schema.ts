import { z } from 'zod';

import { BaseEntitySchema, ElectronicSignatureSchema } from '../common/base-entity.schema';
import { UserIdSchema } from '../common/branded-ids';

// ─── ACCOUNT ──────────────────────────────────────────────────────────────────

export const AccountTypeEnum = z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']);
export type AccountType = z.infer<typeof AccountTypeEnum>;

/**
 * Chart of Accounts entry — hierarchical account structure.
 * account_code: 1000–9999 (1xxx ASSET, 2xxx LIABILITY, 3xxx EQUITY, 4xxx REVENUE, 5-9xxx EXPENSE)
 */
export const AccountSchema = BaseEntitySchema.extend({
  account_code: z.string().regex(/^\d{4}$/, {
    message: 'account_code must be a 4-digit number 1000-9999',
  }),
  account_type: AccountTypeEnum,
  parent_id: z.string().uuid().nullable(),
  name: z.string().min(2).max(200),
  description: z.string().max(1000).nullable(),
  is_active: z.boolean().default(true),
});
export type Account = z.infer<typeof AccountSchema>;

export const JournalLineSchema = z.object({
  id: z.string().uuid(),
  entry_id: z.string().uuid(),
  account_id: z.string().uuid(),
  account_code: z.string(),
  description: z.string().max(500),
  /** Debit amount in base currency (≥ 0, exclusive with credit) */
  debit_amount: z.number().nonnegative(),
  /** Credit amount in base currency (≥ 0, exclusive with debit) */
  credit_amount: z.number().nonnegative(),
  /** Optional cost-centre / batch reference */
  batch_id: z.string().uuid().nullable(),
});
export type JournalLine = z.infer<typeof JournalLineSchema>;

export const JournalEntryStatusEnum = z.enum(['DRAFT', 'POSTED', 'REVERSED']);
export type JournalEntryStatus = z.infer<typeof JournalEntryStatusEnum>;

/**
 * Double-entry journal entry.
 * POSTED entries are immutable — reverse with a new REVERSED entry per GAAP/IFRS.
 */
export const JournalEntrySchema = BaseEntitySchema.extend({
  entry_number: z.string().regex(/^JE-\d{4}-\d{6}$/, {
    message: 'entry_number must match JE-YYYY-NNNNNN',
  }),
  description: z.string().min(3).max(500),
  entry_date: z.string().date(),
  status: JournalEntryStatusEnum,
  lines: z.array(JournalLineSchema).min(2),
  /** Reference to reversed entry (if any) */
  reversal_of_id: z.string().uuid().nullable(),
  /** E-signature for POSTED status (financial authorization) */
  electronic_signature: ElectronicSignatureSchema.nullable(),
});
export type JournalEntry = z.infer<typeof JournalEntrySchema>;

// ─── BIOLOGICAL ASSET (IAS 41) ────────────────────────────────────────────────

export const ValuationMethodEnum = z.enum(['FAIR_VALUE', 'COST']);
export type ValuationMethod = z.infer<typeof ValuationMethodEnum>;

/**
 * Biological asset valuation record per IAS 41 Agriculture.
 * Medical cannabis plants are biological assets under IAS 41.
 * Fair value = market price net of estimated point-of-sale costs.
 */
export const BiologicalAssetSchema = BaseEntitySchema.extend({
  batch_id: z.string().uuid(),
  valuation_method: ValuationMethodEnum,
  /** Fair value in base currency (required if valuation_method=FAIR_VALUE) */
  fair_value: z.number().nonnegative().nullable(),
  /** Estimated cost to sell (deducted from fair value to get NRV) */
  cost_to_sell: z.number().nonnegative().nullable(),
  /** Net realizable value = fair_value - cost_to_sell */
  net_realizable_value: z.number().nonnegative().nullable(),
  /** Historical cost (required if valuation_method=COST) */
  cost_value: z.number().nonnegative().nullable(),
  /** Quantity (grams) at the time of valuation */
  quantity_grams: z.number().nonnegative(),
  valued_at: z.string().datetime({ offset: true }),
  valued_by: UserIdSchema,
  /** E-signature of the person who authorized this valuation — null for system-triggered records */
  electronic_signature: ElectronicSignatureSchema.nullable(),
  /** FK to journal_entries — the JE that records this valuation change */
  journal_entry_id: z.string().uuid().nullable(),
});
export type BiologicalAsset = z.infer<typeof BiologicalAssetSchema>;

// ─── COST ALLOCATION ─────────────────────────────────────────────────────────

export const CostTypeEnum = z.enum([
  'DIRECT_LABOR',
  'OVERHEAD',
  'MATERIAL',
  'DEPRECIATION',
  'UTILITIES',
]);
export type CostType = z.infer<typeof CostTypeEnum>;

/**
 * Cost allocation to a plant batch (cost-per-gram tracking).
 * Drives IAS 41 COST method valuation.
 */
export const CostAllocationSchema = BaseEntitySchema.extend({
  batch_id: z.string().uuid(),
  cost_type: CostTypeEnum,
  amount: z.number().positive(),
  /** Period in YYYY-MM format */
  period: z.string().regex(/^\d{4}-\d{2}$/, { message: 'period must be YYYY-MM' }),
  /** How costs were apportioned (e.g., "by grow-hours") */
  allocation_basis: z.string().min(3).max(200),
  journal_entry_id: z.string().uuid().nullable(),
});
export type CostAllocation = z.infer<typeof CostAllocationSchema>;

// ─── PAYROLL ─────────────────────────────────────────────────────────────────

export const PayrollRunStatusEnum = z.enum([
  'DRAFT',
  'CALCULATED',
  'APPROVED',
  'PAID',
  'CANCELLED',
]);
export type PayrollRunStatus = z.infer<typeof PayrollRunStatusEnum>;

export const PayrollLineSchema = z.object({
  id: z.string().uuid(),
  payroll_run_id: z.string().uuid(),
  employee_id: z.string().uuid(),
  gross_pay: z.number().nonnegative(),
  deductions: z.number().nonnegative(),
  net_pay: z.number().nonnegative(),
  pay_type: z.enum(['SALARY', 'HOURLY', 'BONUS', 'OVERTIME']),
  hours_worked: z.number().nonnegative().nullable(),
});
export type PayrollLine = z.infer<typeof PayrollLineSchema>;

export const PayrollRunSchema = BaseEntitySchema.extend({
  run_number: z.string().regex(/^PR-\d{4}-\d{4}$/, {
    message: 'run_number must match PR-YYYY-NNNN',
  }),
  pay_period_start: z.string().date(),
  pay_period_end: z.string().date(),
  status: PayrollRunStatusEnum,
  total_gross: z.number().nonnegative(),
  total_deductions: z.number().nonnegative(),
  total_net: z.number().nonnegative(),
  lines: z.array(PayrollLineSchema).default([]),
  electronic_signature: ElectronicSignatureSchema.nullable(),
  journal_entry_id: z.string().uuid().nullable(),
});
export type PayrollRun = z.infer<typeof PayrollRunSchema>;

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export const CreateAccountSchema = z.object({
  account_code: z.string().regex(/^\d{4}$/),
  account_type: AccountTypeEnum,
  parent_id: z.string().uuid().optional(),
  name: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
});
export type CreateAccount = z.infer<typeof CreateAccountSchema>;

export const CreateJournalEntrySchema = z.object({
  description: z.string().min(3).max(500),
  entry_date: z.string().date(),
  lines: z
    .array(
      z.object({
        account_id: z.string().uuid(),
        account_code: z.string().regex(/^\d{4}$/),
        description: z.string().max(500),
        debit_amount: z.number().nonnegative(),
        credit_amount: z.number().nonnegative(),
        batch_id: z.string().uuid().optional(),
      }),
    )
    .min(2),
  electronic_signature: ElectronicSignatureSchema.optional(),
});
export type CreateJournalEntry = z.infer<typeof CreateJournalEntrySchema>;

export const RecordBiologicalAssetValuationSchema = z.object({
  batch_id: z.string().uuid(),
  valuation_method: ValuationMethodEnum,
  fair_value: z.number().nonnegative().optional(),
  cost_to_sell: z.number().nonnegative().optional(),
  cost_value: z.number().nonnegative().optional(),
  quantity_grams: z.number().nonnegative(),
  /** Optional for system-triggered entries (initial IAS 41 recognition); required for manual revaluations */
  electronic_signature: ElectronicSignatureSchema.optional(),
});
export type RecordBiologicalAssetValuation = z.infer<typeof RecordBiologicalAssetValuationSchema>;
