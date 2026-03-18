import { CreateChangeControlUseCase } from './create-change-control.use-case';
import type { ChangeControl } from '@gacp-erp/shared-schemas';
import type { UserId } from '@gacp-erp/shared-schemas';

// ─── STUBS & FACTORIES ────────────────────────────────────────────────────────

const REQUESTOR_ID = '00000000-0000-0000-0000-000000000099';
const CC_ID = '00000000-0000-0000-0000-000000000001';

const makeCreatedCC = (overrides: Partial<ChangeControl> = {}): ChangeControl => ({
  id: CC_ID,
  ccn_number: 'CCN-2026-0001',
  title: 'Update SOP',
  description: 'Update irrigation SOP to reflect new procedure',
  change_type: 'MINOR',
  status: 'DRAFT',
  requestor_id: REQUESTOR_ID as UserId,
  approver_ids: [],
  electronic_signature: null,
  validation_status: 'unvalidated',
  validation_protocol_id: null,
  last_validated_at: null,
  next_review_date: null,
  retention_class: '7_YEAR',
  audit_tx_id: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  created_by: REQUESTOR_ID as UserId,
  updated_by: REQUESTOR_ID as UserId,
  ...overrides,
});

// ─── MOCKS ────────────────────────────────────────────────────────────────────

const mockRepo = {
  nextCcnNumber: jest.fn().mockResolvedValue('CCN-2026-0001'),
  create: jest.fn().mockResolvedValue(makeCreatedCC()),
};

const mockOutboxRepo = {
  createWithTx: jest.fn().mockResolvedValue(undefined),
};

const mockDb = {
  transaction: jest.fn().mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn({})),
};

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('CreateChangeControlUseCase', () => {
  let useCase: CreateChangeControlUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo.nextCcnNumber.mockResolvedValue('CCN-2026-0001');
    mockRepo.create.mockResolvedValue(makeCreatedCC());
    mockOutboxRepo.createWithTx.mockResolvedValue(undefined);
    mockDb.transaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn({}));

    useCase = new CreateChangeControlUseCase(
      mockDb as never,
      mockRepo as never,
      mockOutboxRepo as never,
    );
  });

  it('should create a change control in DRAFT status', async () => {
    const dto = {
      title: 'Update SOP',
      description: 'Update irrigation SOP to reflect new procedure',
      change_type: 'MINOR' as const,
    };

    const result = await useCase.execute(dto, REQUESTOR_ID);

    expect(result.status).toBe('DRAFT');
    expect(result.ccn_number).toBe('CCN-2026-0001');
  });

  it('should call nextCcnNumber to generate CCN', async () => {
    const dto = { title: 'Update SOP', description: 'text', change_type: 'MINOR' as const };
    await useCase.execute(dto, REQUESTOR_ID);

    expect(mockRepo.nextCcnNumber).toHaveBeenCalledTimes(1);
  });

  it('should call repo.create with correct data', async () => {
    const dto = {
      title: 'Update SOP',
      description: 'Update irrigation SOP to reflect new procedure',
      change_type: 'MAJOR' as const,
      approver_ids: ['00000000-0000-0000-0000-000000000002' as UserId],
    };

    await useCase.execute(dto, REQUESTOR_ID);

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.anything(), // tx
      expect.objectContaining({
        ccn_number: 'CCN-2026-0001',
        title: dto.title,
        description: dto.description,
        change_type: 'MAJOR',
        status: 'DRAFT',
        requestor_id: REQUESTOR_ID,
        created_by: REQUESTOR_ID,
        updated_by: REQUESTOR_ID,
      }),
    );
  });

  it('should publish outbox event after creation', async () => {
    const dto = { title: 'Update SOP', description: 'text', change_type: 'MINOR' as const };
    await useCase.execute(dto, REQUESTOR_ID);

    expect(mockOutboxRepo.createWithTx).toHaveBeenCalledTimes(1);
    const [, eventArg] = mockOutboxRepo.createWithTx.mock.calls[0];
    expect(eventArg.topic).toBe('quality.change.v1');
    expect(eventArg.key).toBe(CC_ID);
    expect(eventArg.payload).toMatchObject({
      eventType: 'quality.change.requested',
      payload: expect.objectContaining({
        changeControlId: CC_ID,
        ccnNumber: 'CCN-2026-0001',
        requestorId: REQUESTOR_ID,
      }),
    });
  });

  it('should run create and outbox inside same transaction', async () => {
    const dto = { title: 'Update SOP', description: 'text', change_type: 'MINOR' as const };
    await useCase.execute(dto, REQUESTOR_ID);

    expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    // Both repo.create and outboxRepo.createWithTx should have been called within the transaction
    expect(mockRepo.create).toHaveBeenCalledTimes(1);
    expect(mockOutboxRepo.createWithTx).toHaveBeenCalledTimes(1);
  });

  it('should propagate error if repo.create fails', async () => {
    mockRepo.create.mockRejectedValueOnce(new Error('DB write failed'));
    mockDb.transaction.mockImplementationOnce((fn: (tx: unknown) => Promise<unknown>) => fn({}));

    const dto = { title: 'title', description: 'text', change_type: 'MINOR' as const };
    await expect(useCase.execute(dto, REQUESTOR_ID)).rejects.toThrow('DB write failed');
  });
});
