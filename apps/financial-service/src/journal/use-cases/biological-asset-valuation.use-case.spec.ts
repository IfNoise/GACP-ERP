import { BiologicalAssetValuationUseCase } from './biological-asset-valuation.use-case';
import type { BiologicalAsset, UserId } from '@gacp-erp/shared-schemas';

// ─── FACTORIES ────────────────────────────────────────────────────────────────

const AUTHOR_ID = '00000000-0000-0000-0000-000000000099';
const ASSET_ID = '00000000-0000-0000-0000-000000000001';
const BATCH_ID = '00000000-0000-0000-0000-000000000002';

const makeSig = () => ({
  signed_by: AUTHOR_ID as UserId,
  signer_name: 'Test User',
  signer_role: 'FINANCIAL_MANAGER',
  signature_type: 'approval' as const,
  authentication_method: 'password' as const,
  digital_signature: 'a'.repeat(256),
  content_hash: 'a'.repeat(64),
  ip_address: '127.0.0.1',
  workstation_id: 'WS-001',
  signature_meaning: 'IAS 41 fair value valuation',
  signed_at: '2026-01-15T00:00:00.000Z',
});

const makeAsset = (overrides: Partial<BiologicalAsset> = {}): BiologicalAsset => ({
  id: ASSET_ID,
  batch_id: BATCH_ID,
  valuation_method: 'FAIR_VALUE',
  fair_value: 10000,
  cost_to_sell: 500,
  net_realizable_value: 9500,
  cost_value: null,
  quantity_grams: 5000,
  valued_at: '2026-01-15T00:00:00.000Z',
  valued_by: AUTHOR_ID as UserId,
  electronic_signature: makeSig(),
  journal_entry_id: null,
  created_at: '2026-01-15T00:00:00.000Z',
  updated_at: '2026-01-15T00:00:00.000Z',
  created_by: AUTHOR_ID as UserId,
  updated_by: AUTHOR_ID as UserId,
  ...overrides,
});

// ─── MOCKS ────────────────────────────────────────────────────────────────────

const mockRepo = {
  create: jest.fn().mockResolvedValue(makeAsset()),
};

const mockOutboxRepo = {
  createWithTx: jest.fn().mockResolvedValue(undefined),
};

const mockDb = {
  transaction: jest.fn().mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn({})),
};

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('BiologicalAssetValuationUseCase', () => {
  let useCase: BiologicalAssetValuationUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo.create.mockResolvedValue(makeAsset());
    mockDb.transaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn({}));

    useCase = new BiologicalAssetValuationUseCase(
      mockDb as never,
      mockRepo as never,
      mockOutboxRepo as never,
    );
  });

  it('should record a FAIR_VALUE biological asset valuation', async () => {
    const dto = {
      batch_id: BATCH_ID,
      valuation_method: 'FAIR_VALUE' as const,
      fair_value: 10000,
      cost_to_sell: 500,
      quantity_grams: 5000,
      valued_at: '2026-01-15T00:00:00.000Z',
      electronic_signature: makeSig(),
    };

    const result = await useCase.execute(dto, AUTHOR_ID);
    expect(result.valuation_method).toBe('FAIR_VALUE');
    expect(result.batch_id).toBe(BATCH_ID);
  });

  it('should record a COST-based valuation', async () => {
    mockRepo.create.mockResolvedValue(
      makeAsset({ valuation_method: 'COST', cost_value: 7500, fair_value: null }),
    );

    const dto = {
      batch_id: BATCH_ID,
      valuation_method: 'COST' as const,
      cost_value: 7500,
      quantity_grams: 5000,
      valued_at: '2026-01-15T00:00:00.000Z',
      electronic_signature: makeSig(),
    };

    const result = await useCase.execute(dto, AUTHOR_ID);
    expect(result.valuation_method).toBe('COST');
  });

  it('should publish a BiologicalAssetValuedEvent', async () => {
    const dto = {
      batch_id: BATCH_ID,
      valuation_method: 'FAIR_VALUE' as const,
      fair_value: 10000,
      cost_to_sell: 500,
      quantity_grams: 5000,
      valued_at: '2026-01-15T00:00:00.000Z',
      electronic_signature: makeSig(),
    };

    await useCase.execute(dto, AUTHOR_ID);

    expect(mockOutboxRepo.createWithTx).toHaveBeenCalledTimes(1);
    const [, eventArg] = mockOutboxRepo.createWithTx.mock.calls[0];
    expect(eventArg.topic).toBe('finance.transaction.v1');
    expect(eventArg.payload).toMatchObject({
      eventType: 'finance.biological_asset.valued',
      payload: expect.objectContaining({ batchId: BATCH_ID, valuationMethod: 'FAIR_VALUE' }),
    });
  });

  it('should run inside a transaction', async () => {
    const dto = {
      batch_id: BATCH_ID,
      valuation_method: 'FAIR_VALUE' as const,
      fair_value: 10000,
      quantity_grams: 5000,
      valued_at: '2026-01-15T00:00:00.000Z',
      electronic_signature: makeSig(),
    };
    await useCase.execute(dto, AUTHOR_ID);
    expect(mockDb.transaction).toHaveBeenCalledTimes(1);
  });

  it('should pass electronic signature to repository', async () => {
    const sig = makeSig();
    const dto = {
      batch_id: BATCH_ID,
      valuation_method: 'FAIR_VALUE' as const,
      fair_value: 10000,
      quantity_grams: 5000,
      valued_at: '2026-01-15T00:00:00.000Z',
      electronic_signature: sig,
    };

    await useCase.execute(dto, AUTHOR_ID);

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ electronic_signature: sig }),
    );
  });
});
