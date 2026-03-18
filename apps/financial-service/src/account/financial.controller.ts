import { Controller, Get, Post, Param, Query, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { z } from 'zod';
import {
  CreateJournalEntrySchema,
  RecordBiologicalAssetValuationSchema,
  AccountTypeEnum,
  PaginationQuerySchema,
  type CreateJournalEntry,
  type RecordBiologicalAssetValuation,
} from '@gacp-erp/shared-schemas';
import { ZodBody } from '../common/decorators/zod-body.decorator';
import type { AccountRepository, AccountFilters } from './account.repository';
import { type JournalEntryRepository } from '../journal/journal-entry.repository';
import { type BiologicalAssetRepository } from '../journal/biological-asset.repository';
import { type CreateJournalEntryUseCase } from '../journal/use-cases/create-journal-entry.use-case';
import { type BiologicalAssetValuationUseCase } from '../journal/use-cases/biological-asset-valuation.use-case';

const AccountListQuerySchema = PaginationQuerySchema.extend({
  account_type: AccountTypeEnum.optional(),
  is_active: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
});

const PostJournalEntryBodySchema = z.object({
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
});

@Controller({ path: 'financial', version: '1' })
export class FinancialController {
  constructor(
    private readonly accountRepo: AccountRepository,
    private readonly jeRepo: JournalEntryRepository,
    private readonly baRepo: BiologicalAssetRepository,
    private readonly createJeUseCase: CreateJournalEntryUseCase,
    private readonly baValuationUseCase: BiologicalAssetValuationUseCase,
  ) {}

  // ── Accounts ──────────────────────────────────────────────────────────────

  @Get('accounts')
  listAccounts(@Query() rawQuery: unknown) {
    const { account_type, is_active, ...pagination } = AccountListQuerySchema.parse(rawQuery);
    const filters: AccountFilters = {};
    if (account_type !== undefined) filters.account_type = account_type;
    if (is_active !== undefined) filters.is_active = is_active;
    return this.accountRepo.findMany(filters, pagination);
  }

  @Get('accounts/:id')
  getAccount(@Param('id') id: string) {
    return this.accountRepo.findByIdOrThrow(id);
  }

  // ── Journal Entries ───────────────────────────────────────────────────────

  @Post('journal-entries')
  @HttpCode(HttpStatus.CREATED)
  createJournalEntry(
    @ZodBody(CreateJournalEntrySchema) dto: CreateJournalEntry,
    @Headers('x-user-id') userId: string,
  ) {
    return this.createJeUseCase.execute(dto, userId ?? 'system');
  }

  @Get('journal-entries/:id')
  getJournalEntry(@Param('id') id: string) {
    return this.jeRepo.findByIdOrThrow(id);
  }

  @Post('journal-entries/:id/post')
  @HttpCode(HttpStatus.OK)
  postJournalEntry(
    @Param('id') id: string,
    @ZodBody(PostJournalEntryBodySchema) body: z.infer<typeof PostJournalEntryBodySchema>,
    @Headers('x-user-id') userId: string,
  ) {
    return this.jeRepo.post(undefined as never, id, body.electronic_signature, userId as never);
  }

  // ── Biological Assets ─────────────────────────────────────────────────────

  @Post('biological-assets/valuations')
  @HttpCode(HttpStatus.CREATED)
  recordValuation(
    @ZodBody(RecordBiologicalAssetValuationSchema) dto: RecordBiologicalAssetValuation,
    @Headers('x-user-id') userId: string,
  ) {
    return this.baValuationUseCase.execute(dto, userId ?? 'system');
  }

  @Get('biological-assets/:batchId')
  getLatestValuation(@Param('batchId') batchId: string) {
    return this.baRepo.findLatestByBatchId(batchId);
  }
}
