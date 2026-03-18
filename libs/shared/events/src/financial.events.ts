import { z } from 'zod';
import { EventHeaderSchema } from './base.events';

// ─── KAFKA TOPICS ─────────────────────────────────────────────────────────────
export const FINANCE_TRANSACTION_TOPIC = 'finance.transaction.v1' as const;

// ─── PAYLOAD FRAGMENTS ───────────────────────────────────────────────────────

const JournalEntryRefSchema = z.object({
  journalEntryId: z.string().uuid(),
  entryNumber: z.string().regex(/^JE-\d{4}-\d{6}$/),
  entryDate: z.string().date(),
});

const BiologicalAssetRefSchema = z.object({
  biologicalAssetId: z.string().uuid(),
  batchId: z.string().uuid(),
  valuationMethod: z.enum(['FAIR_VALUE', 'COST']),
});

// ════════════════════════════════════════════════════════════════════════════════
// JOURNAL ENTRY EVENTS — topic: finance.transaction.v1
// ════════════════════════════════════════════════════════════════════════════════

export const JournalEntryPostedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('finance.journal_entry.posted'),
  topic: z.literal(FINANCE_TRANSACTION_TOPIC),
  payload: JournalEntryRefSchema.extend({
    description: z.string(),
    totalDebit: z.number().nonnegative(),
    postedBy: z.string().uuid(),
    postedAt: z.string().datetime({ offset: true }),
  }),
});
export type JournalEntryPostedEvent = z.infer<typeof JournalEntryPostedEventSchema>;

export const JournalEntryReversedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('finance.journal_entry.reversed'),
  topic: z.literal(FINANCE_TRANSACTION_TOPIC),
  payload: JournalEntryRefSchema.extend({
    reversalEntryId: z.string().uuid(),
    reversedBy: z.string().uuid(),
    reversedAt: z.string().datetime({ offset: true }),
  }),
});
export type JournalEntryReversedEvent = z.infer<typeof JournalEntryReversedEventSchema>;

// ════════════════════════════════════════════════════════════════════════════════
// BIOLOGICAL ASSET EVENTS — topic: finance.transaction.v1
// ════════════════════════════════════════════════════════════════════════════════

export const BiologicalAssetValuedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('finance.biological_asset.valued'),
  topic: z.literal(FINANCE_TRANSACTION_TOPIC),
  payload: BiologicalAssetRefSchema.extend({
    fairValue: z.number().nonnegative().nullable(),
    netRealizableValue: z.number().nonnegative().nullable(),
    quantityGrams: z.number().nonnegative(),
    valuedBy: z.string().uuid(),
    valuedAt: z.string().datetime({ offset: true }),
  }),
});
export type BiologicalAssetValuedEvent = z.infer<typeof BiologicalAssetValuedEventSchema>;

export const CostAllocationCreatedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('finance.cost_allocation.created'),
  topic: z.literal(FINANCE_TRANSACTION_TOPIC),
  payload: z.object({
    allocationId: z.string().uuid(),
    batchId: z.string().uuid(),
    costType: z.enum(['DIRECT_LABOR', 'OVERHEAD', 'MATERIAL', 'DEPRECIATION', 'UTILITIES']),
    amount: z.number().positive(),
    period: z.string().regex(/^\d{4}-\d{2}$/),
    createdBy: z.string().uuid(),
  }),
});
export type CostAllocationCreatedEvent = z.infer<typeof CostAllocationCreatedEventSchema>;

export const PayrollRunCompletedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('finance.payroll_run.completed'),
  topic: z.literal(FINANCE_TRANSACTION_TOPIC),
  payload: z.object({
    payrollRunId: z.string().uuid(),
    runNumber: z.string().regex(/^PR-\d{4}-\d{4}$/),
    payPeriodStart: z.string().date(),
    payPeriodEnd: z.string().date(),
    totalGross: z.number().nonnegative(),
    totalNet: z.number().nonnegative(),
    lineCount: z.number().int().nonnegative(),
    completedBy: z.string().uuid(),
  }),
});
export type PayrollRunCompletedEvent = z.infer<typeof PayrollRunCompletedEventSchema>;

/** Discriminated union of all Finance Transaction events */
export const FinanceTransactionEventSchema = z.discriminatedUnion('eventType', [
  JournalEntryPostedEventSchema,
  JournalEntryReversedEventSchema,
  BiologicalAssetValuedEventSchema,
  CostAllocationCreatedEventSchema,
  PayrollRunCompletedEventSchema,
]);
export type FinanceTransactionEvent = z.infer<typeof FinanceTransactionEventSchema>;
