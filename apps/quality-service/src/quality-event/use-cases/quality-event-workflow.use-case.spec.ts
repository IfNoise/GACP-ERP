import { ConflictException, NotFoundException } from '@nestjs/common';
import { QualityEventWorkflowUseCase } from './quality-event-workflow.use-case';
import type { QualityEvent, ElectronicSignature, UserId } from '@gacp-erp/shared-schemas';

const OPERATOR_ID = '00000000-0000-0000-0000-000000000099';
const EVENT_ID = '00000000-0000-0000-0000-000000000001';
const CAPA_ID = '00000000-0000-0000-0000-000000000002';

const makeSignature = (): ElectronicSignature => ({
  signed_by: OPERATOR_ID as UserId,
  signer_name: 'Quality Manager',
  signer_role: 'QA',
  signature_type: 'approval',
  authentication_method: 'password',
  digital_signature: 'b'.repeat(256),
  content_hash: 'c'.repeat(64),
  ip_address: '10.0.0.1',
  workstation_id: 'WS-002',
  signature_meaning: 'I close this quality event',
  signed_at: '2026-01-01T00:00:00.000Z',
});

const makeQualityEvent = (status: QualityEvent['status']): QualityEvent => ({
  id: EVENT_ID,
  event_number: 'QE-2026-0001',
  type: 'COMPLAINT',
  severity: 'HIGH',
  status,
  title: 'Customer complaint about product appearance',
  description: 'Customer reported unexpected discoloration of product batch X-202',
  capa_id: null,
  linked_records: [],
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
});

const mockRepo = {
  nextEventNumber: jest.fn().mockResolvedValue('QE-2026-0001'),
  create: jest.fn(),
  update: jest.fn(),
  findByIdOrThrow: jest.fn(),
  addLinkedRecord: jest.fn(),
};

const mockOutboxRepo = {
  createWithTx: jest.fn().mockResolvedValue(undefined),
};

// Minimal tx mock that also forwards raw SQL via .select() chain for CAPA lookup
const makeTx = (capaNumber = 'CA-2026-0001') => ({
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockResolvedValue([{ capa_number: capaNumber }]),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockResolvedValue([]),
});

const mockDb = {
  transaction: jest.fn(),
};

describe('QualityEventWorkflowUseCase', () => {
  let useCase: QualityEventWorkflowUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOutboxRepo.createWithTx.mockResolvedValue(undefined);
    const tx = makeTx();
    mockDb.transaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn(tx));
    useCase = new QualityEventWorkflowUseCase(
      mockDb as never,
      mockRepo as never,
      mockOutboxRepo as never,
    );
  });

  // ─── create ────────────────────────────────────────────────────────────────

  describe('create()', () => {
    const dto = {
      type: 'COMPLAINT' as const,
      severity: 'HIGH' as const,
      title: 'Customer complaint about product appearance',
      description: 'Customer reported unexpected discoloration of product batch X-202',
    };

    it('should create a quality event in OPEN status', async () => {
      mockRepo.create.mockResolvedValue(makeQualityEvent('OPEN'));

      const result = await useCase.create(dto, OPERATOR_ID);

      expect(result.status).toBe('OPEN');
      expect(mockRepo.nextEventNumber).toHaveBeenCalledTimes(1);
    });

    it('should publish QualityEventReportedEvent', async () => {
      mockRepo.create.mockResolvedValue(makeQualityEvent('OPEN'));

      await useCase.create(dto, OPERATOR_ID);

      const [, outboxEntry] = mockOutboxRepo.createWithTx.mock.calls[0];
      expect(outboxEntry.payload.eventType).toBe('quality.events.reported');
      expect(outboxEntry.topic).toBe('quality.events.v1');
    });
  });

  // ─── investigate ───────────────────────────────────────────────────────────

  describe('investigate()', () => {
    const dto = { investigation_summary: 'Root cause analysis in progress' };

    it('should transition OPEN → INVESTIGATING', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeQualityEvent('OPEN'));
      mockRepo.update.mockResolvedValue(makeQualityEvent('INVESTIGATING'));

      const result = await useCase.investigate(EVENT_ID, dto, OPERATOR_ID);

      expect(result.status).toBe('INVESTIGATING');
    });

    it('should publish QualityEventInvestigatedEvent', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeQualityEvent('OPEN'));
      mockRepo.update.mockResolvedValue(makeQualityEvent('INVESTIGATING'));

      await useCase.investigate(EVENT_ID, dto, OPERATOR_ID);

      const [, outboxEntry] = mockOutboxRepo.createWithTx.mock.calls[0];
      expect(outboxEntry.payload.eventType).toBe('quality.events.investigated');
    });

    it('should throw ConflictException when already INVESTIGATING', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeQualityEvent('INVESTIGATING'));

      await expect(useCase.investigate(EVENT_ID, dto, OPERATOR_ID)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ─── linkRecord ───────────────────────────────────────────────────────────

  describe('linkRecord()', () => {
    it('should transition INVESTIGATING → CAPA_INITIATED when linking capa', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeQualityEvent('INVESTIGATING'));
      mockRepo.addLinkedRecord.mockResolvedValue({});
      mockRepo.update.mockResolvedValue(makeQualityEvent('CAPA_INITIATED'));

      const result = await useCase.linkRecord(
        EVENT_ID,
        { record_type: 'capa', record_id: CAPA_ID },
        OPERATOR_ID,
      );

      expect(result.status).toBe('CAPA_INITIATED');
      const eventTypes = mockOutboxRepo.createWithTx.mock.calls.map(
        ([, e]: [unknown, { payload: { eventType: string } }]) => e.payload.eventType,
      );
      expect(eventTypes).toContain('quality.events.capa_linked');
    });

    it('should not transition status when linking non-capa record', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeQualityEvent('INVESTIGATING'));
      mockRepo.addLinkedRecord.mockResolvedValue({});
      mockRepo.update.mockResolvedValue(makeQualityEvent('INVESTIGATING'));

      await useCase.linkRecord(
        EVENT_ID,
        { record_type: 'deviation', record_id: CAPA_ID },
        OPERATOR_ID,
      );

      const updateArgs = mockRepo.update.mock.calls[0][2];
      expect(updateArgs.status).toBeUndefined();
    });

    it('should throw NotFoundException when CAPA record_id does not exist', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeQualityEvent('INVESTIGATING'));
      mockRepo.addLinkedRecord.mockResolvedValue({});
      mockRepo.update.mockResolvedValue(makeQualityEvent('INVESTIGATING'));

      // Override tx to return empty CAPA lookup
      const emptyCapaTx = {
        ...makeTx(),
        limit: jest.fn().mockResolvedValue([]),
      };
      mockDb.transaction.mockImplementationOnce((fn: (tx: unknown) => Promise<unknown>) =>
        fn(emptyCapaTx),
      );

      await expect(
        useCase.linkRecord(EVENT_ID, { record_type: 'capa', record_id: CAPA_ID }, OPERATOR_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── close ─────────────────────────────────────────────────────────────────

  describe('close()', () => {
    const closeDto = {
      closure_summary: 'All corrective actions verified. Event officially closed.',
      electronic_signature: makeSignature(),
    };

    it('should transition INVESTIGATING → CLOSED and publish QualityEventClosedEvent', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeQualityEvent('INVESTIGATING'));
      mockRepo.update.mockResolvedValue(makeQualityEvent('CLOSED'));

      const result = await useCase.close(EVENT_ID, closeDto, OPERATOR_ID);

      expect(result.status).toBe('CLOSED');
      const [, outboxEntry] = mockOutboxRepo.createWithTx.mock.calls[0];
      expect(outboxEntry.payload.eventType).toBe('quality.events.closed');
      expect(outboxEntry.payload.payload.closureSummary).toBe(closeDto.closure_summary);
    });

    it('should transition CAPA_INITIATED → CLOSED', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeQualityEvent('CAPA_INITIATED'));
      mockRepo.update.mockResolvedValue(makeQualityEvent('CLOSED'));

      const result = await useCase.close(EVENT_ID, closeDto, OPERATOR_ID);

      expect(result.status).toBe('CLOSED');
    });

    it('should throw ConflictException when status is OPEN', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeQualityEvent('OPEN'));

      await expect(useCase.close(EVENT_ID, closeDto, OPERATOR_ID)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
