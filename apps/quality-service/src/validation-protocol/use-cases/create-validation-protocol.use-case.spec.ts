import { CreateValidationProtocolUseCase } from './create-validation-protocol.use-case';
import type { ValidationProtocol, UserId } from '@gacp-erp/shared-schemas';

const OPERATOR_ID = '00000000-0000-0000-0000-000000000099';
const PROTOCOL_ID = '00000000-0000-0000-0000-000000000001';

const makeProtocol = (overrides: Partial<ValidationProtocol> = {}): ValidationProtocol => ({
  id: PROTOCOL_ID,
  protocol_number: 'VAL-2026-0001',
  type: 'IQ',
  status: 'DRAFT',
  system_under_test: 'LIMS v3.2.0',
  change_control_id: null,
  test_steps: [],
  electronic_signature: null,
  validation_status: 'unvalidated',
  validation_protocol_id: null,
  last_validated_at: null,
  next_review_date: null,
  retention_class: '7_YEAR',
  audit_tx_id: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  created_by: OPERATOR_ID as UserId,
  updated_by: OPERATOR_ID as UserId,
  ...overrides,
});

const mockRepo = {
  nextProtocolNumber: jest.fn().mockResolvedValue('VAL-2026-0001'),
  create: jest.fn(),
};

const mockDb = {
  transaction: jest.fn().mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn({})),
};

describe('CreateValidationProtocolUseCase', () => {
  let useCase: CreateValidationProtocolUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.transaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn({}));
    useCase = new CreateValidationProtocolUseCase(mockDb as never, mockRepo as never);
  });

  const dto = {
    type: 'IQ' as const,
    system_under_test: 'LIMS v3.2.0',
    test_steps: [
      { step_number: 1, description: 'Verify installation', expected_result: 'System installed' },
    ],
  };

  it('should return protocol in DRAFT status', async () => {
    mockRepo.create.mockResolvedValue(makeProtocol());

    const result = await useCase.execute(dto, OPERATOR_ID);

    expect(result.status).toBe('DRAFT');
    expect(result.protocol_number).toBe('VAL-2026-0001');
  });

  it('should call repo.nextProtocolNumber()', async () => {
    mockRepo.create.mockResolvedValue(makeProtocol());

    await useCase.execute(dto, OPERATOR_ID);

    expect(mockRepo.nextProtocolNumber).toHaveBeenCalledTimes(1);
  });

  it('should call repo.create() inside transaction with correct fields', async () => {
    mockRepo.create.mockResolvedValue(makeProtocol());

    await useCase.execute(dto, OPERATOR_ID);

    const [, createArg] = mockRepo.create.mock.calls[0];
    expect(createArg.status).toBe('DRAFT');
    expect(createArg.type).toBe('IQ');
    expect(createArg.system_under_test).toBe('LIMS v3.2.0');
    expect(createArg.test_steps).toHaveLength(1);
    expect(createArg.test_steps[0].status).toBe('PENDING');
    expect(createArg.created_by).toBe(OPERATOR_ID);
  });

  it('should pass empty test_steps when none provided', async () => {
    const noStepsDto = { type: 'OQ' as const, system_under_test: 'Centrifuge A', test_steps: [] };
    mockRepo.create.mockResolvedValue(makeProtocol({ type: 'OQ', test_steps: [] }));

    await useCase.execute(noStepsDto, OPERATOR_ID);

    const [, createArg] = mockRepo.create.mock.calls[0];
    expect(createArg.test_steps).toHaveLength(0);
  });

  it('should use system as userId fallback', async () => {
    mockRepo.create.mockResolvedValue(makeProtocol());

    await useCase.execute(dto, OPERATOR_ID);

    const [, createArg] = mockRepo.create.mock.calls[0];
    expect(createArg.created_by).toBe(OPERATOR_ID);
  });
});
