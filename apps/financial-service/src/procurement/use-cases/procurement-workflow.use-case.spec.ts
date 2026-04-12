import { BadRequestException } from '@nestjs/common';
import {
  ProcurementWorkflowUseCase,
  type SubmitPOCommand,
  type AcknowledgePOCommand,
  type ReceiveGoodsCommand,
  type ClosePOCommand,
  type CancelPOCommand,
} from './procurement-workflow.use-case';
import type { PurchaseOrder, ReceivingRecord, UserId } from '@gacp-erp/shared-schemas';

// ─── FACTORIES ────────────────────────────────────────────────────────────────

const AUTHOR_ID = '00000000-0000-0000-0000-000000000099';
const PO_ID = '00000000-0000-0000-0000-000000000001';
const SUPPLIER_ID = '00000000-0000-0000-0000-000000000002';
const GRN_ID = '00000000-0000-0000-0000-000000000010';

const makeSig = () => ({
  signed_by: AUTHOR_ID as UserId,
  signer_name: 'Finance Manager',
  signer_role: 'FINANCIAL_MANAGER',
  signature_type: 'approval' as const,
  authentication_method: 'password' as const,
  digital_signature: 'a'.repeat(256),
  content_hash: 'a'.repeat(64),
  ip_address: '10.0.0.1',
  workstation_id: 'WS-001',
  signature_meaning: 'PO approval',
  signed_at: '2026-01-15T00:00:00.000Z',
});

const makePOLine = (overrides: Record<string, unknown> = {}) => ({
  id: '00000000-0000-0000-0000-000000000011',
  po_id: PO_ID,
  line_number: 1,
  item_description: 'Cannabis seeds',
  quantity: 100,
  unit_price: 5,
  unit_of_measure: 'KG',
  received_quantity: 0,
  strain_id: null,
  ...overrides,
});

const makePO = (
  status: PurchaseOrder['status'] = 'DRAFT',
  overrides: Partial<PurchaseOrder> = {},
): PurchaseOrder => ({
  id: PO_ID,
  po_number: 'PO-2026-0001',
  supplier_id: SUPPLIER_ID,
  status,
  lines: [makePOLine()],
  total_value: 500,
  currency: 'EUR',
  expected_delivery_date: '2026-03-01',
  three_way_match_passed: null,
  electronic_signature: null,
  notes: null,
  created_at: '2026-01-15T00:00:00.000Z',
  updated_at: '2026-01-15T00:00:00.000Z',
  created_by: AUTHOR_ID as UserId,
  updated_by: AUTHOR_ID as UserId,
  ...overrides,
});

const makeGRN = (): ReceivingRecord => ({
  id: GRN_ID,
  grn_number: 'GRN-2026-0001',
  po_id: PO_ID,
  received_at: '2026-02-01T00:00:00.000Z',
  received_by: AUTHOR_ID as UserId,
  lines: [] as ReceivingRecord['lines'],
  quality_check_passed: false,
  quality_check_notes: null,
  electronic_signature: makeSig(),
  created_at: '2026-02-01T00:00:00.000Z',
  updated_at: '2026-02-01T00:00:00.000Z',
  created_by: AUTHOR_ID as UserId,
  updated_by: AUTHOR_ID as UserId,
});

// ─── MOCKS ────────────────────────────────────────────────────────────────────

const mockRepo = {
  nextPoNumber: jest.fn().mockResolvedValue('PO-2026-0001'),
  nextGrnNumber: jest.fn().mockResolvedValue('GRN-2026-0001'),
  findByIdOrThrow: jest.fn().mockResolvedValue(makePO('DRAFT')),
  create: jest.fn().mockResolvedValue(makePO('DRAFT')),
  updateStatus: jest.fn().mockResolvedValue(makePO('SUBMITTED')),
  addReceivingRecord: jest.fn().mockResolvedValue(makeGRN()),
};

const mockOutboxRepo = {
  createWithTx: jest.fn().mockResolvedValue(undefined),
};

const mockSupplierRepo = {
  findByIdOrThrow: jest.fn().mockResolvedValue({
    id: SUPPLIER_ID,
    supplier_code: 'SUP-0001',
    name: 'Test Supplier',
    qualification_status: 'QUALIFIED',
    qualification_expiry: null,
    contact_details: { email: null, phone: null, address: null, contact_person: null },
    is_active: true,
    notes: null,
    created_at: '2026-01-15T00:00:00.000Z',
    updated_at: '2026-01-15T00:00:00.000Z',
    created_by: AUTHOR_ID,
    updated_by: AUTHOR_ID,
  }),
};

const mockDb = {
  transaction: jest.fn().mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn({})),
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const buildUseCase = () =>
  new ProcurementWorkflowUseCase(
    mockDb as never,
    mockRepo as never,
    mockSupplierRepo as never,
    mockOutboxRepo as never,
  );

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('ProcurementWorkflowUseCase', () => {
  let useCase: ProcurementWorkflowUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo.nextPoNumber.mockResolvedValue('PO-2026-0001');
    mockRepo.nextGrnNumber.mockResolvedValue('GRN-2026-0001');
    mockRepo.create.mockResolvedValue(makePO('DRAFT'));
    mockRepo.updateStatus.mockResolvedValue(makePO('SUBMITTED'));
    mockRepo.addReceivingRecord.mockResolvedValue(makeGRN());
    mockDb.transaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn({}));
    useCase = buildUseCase();
  });

  describe('createPO', () => {
    it('should create a PO in DRAFT status with generated PO number', async () => {
      const dto = {
        supplier_id: SUPPLIER_ID,
        lines: [
          {
            item_description: 'Cannabis seeds',
            quantity: 100,
            unit_price: 5,
            unit_of_measure: 'KG' as const,
          },
        ],
        currency: 'EUR',
        expected_delivery_date: '2026-03-01',
      };

      const result = await useCase.createPO(dto as never, AUTHOR_ID);

      expect(result.status).toBe('DRAFT');
      expect(result.po_number).toBe('PO-2026-0001');
      expect(mockRepo.nextPoNumber).toHaveBeenCalledTimes(1);
    });

    it('should publish POCreatedEvent inside a transaction', async () => {
      const dto = {
        supplier_id: SUPPLIER_ID,
        lines: [{ item_description: 'Seeds', quantity: 10, unit_price: 2, unit_of_measure: 'KG' }],
      };

      await useCase.createPO(dto as never, AUTHOR_ID);

      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
      const [, eventArg] = mockOutboxRepo.createWithTx.mock.calls[0];
      expect(eventArg.topic).toBe('procurement.po.v1');
      expect(eventArg.payload).toMatchObject({
        eventType: 'procurement.po.created',
      });
    });
  });

  describe('submitPO', () => {
    it('should transition DRAFT → SUBMITTED', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makePO('DRAFT'));
      mockRepo.updateStatus.mockResolvedValue(makePO('SUBMITTED'));

      const cmd: SubmitPOCommand = {
        poId: PO_ID,
        authorId: AUTHOR_ID,
        electronicSignature: makeSig(),
      };

      const result = await useCase.submitPO(cmd);
      expect(result.status).toBe('SUBMITTED');
      expect(mockOutboxRepo.createWithTx).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          payload: expect.objectContaining({ eventType: 'procurement.po.submitted' }),
        }),
      );
    });

    it('should throw BadRequestException for invalid transition DRAFT → RECEIVING', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makePO('DRAFT'));

      const cmd: SubmitPOCommand = {
        poId: PO_ID,
        authorId: AUTHOR_ID,
        electronicSignature: makeSig(),
      };

      // Override the engine's validateTransition to simulate — use a PO in DRAFT
      // and attempt to go to RECEIVING directly (which is invalid)
      await expect(useCase.submitPO({ ...cmd, poId: PO_ID })).resolves.toBeDefined(); // DRAFT→SUBMITTED is valid

      // Now test invalid: manually put PO in RECEIVING and try to submit
      mockRepo.findByIdOrThrow.mockResolvedValue(makePO('RECEIVING'));
      await expect(useCase.submitPO(cmd)).rejects.toThrow(BadRequestException);
    });
  });

  describe('acknowledgePO', () => {
    it('should transition SUBMITTED → ACKNOWLEDGED', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makePO('SUBMITTED'));
      mockRepo.updateStatus.mockResolvedValue(makePO('ACKNOWLEDGED'));

      const cmd: AcknowledgePOCommand = { poId: PO_ID, authorId: AUTHOR_ID };

      const result = await useCase.acknowledgePO(cmd);
      expect(result.status).toBe('ACKNOWLEDGED');
    });
  });

  describe('receiveGoods', () => {
    it('should transition ACKNOWLEDGED → RECEIVING and create GRN', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makePO('ACKNOWLEDGED'));
      mockRepo.updateStatus.mockResolvedValue(makePO('RECEIVING'));

      const cmd: ReceiveGoodsCommand = {
        poId: PO_ID,
        authorId: AUTHOR_ID,
        receivedAt: '2026-02-01T00:00:00.000Z',
        lines: [] as ReceivingRecord['lines'],
        electronicSignature: makeSig(),
      };

      const result = await useCase.receiveGoods(cmd);
      expect(result.status).toBe('RECEIVING');
      expect(mockRepo.addReceivingRecord).toHaveBeenCalledTimes(1);
      expect(mockRepo.nextGrnNumber).toHaveBeenCalledTimes(1);

      const [, eventArg] = mockOutboxRepo.createWithTx.mock.calls[0];
      expect(eventArg.payload).toMatchObject({ eventType: 'procurement.po.goods_received' });
    });
  });

  describe('closePO', () => {
    it('should close PO and perform three-way match', async () => {
      // All lines fully received
      mockRepo.findByIdOrThrow.mockResolvedValue(
        makePO('RECEIVING', { lines: [makePOLine({ received_quantity: 100, quantity: 100 })] }),
      );
      mockRepo.updateStatus.mockResolvedValue(makePO('CLOSED', { three_way_match_passed: true }));

      const cmd: ClosePOCommand = {
        poId: PO_ID,
        authorId: AUTHOR_ID,
        electronicSignature: makeSig(),
      };

      const result = await useCase.closePO(cmd);
      expect(result.status).toBe('CLOSED');
      expect(mockRepo.updateStatus).toHaveBeenCalledWith(
        expect.anything(),
        PO_ID,
        'CLOSED',
        expect.objectContaining({ three_way_match_passed: true }),
      );
    });

    it('should set three_way_match_passed=false if lines not fully received', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(
        makePO('RECEIVING', { lines: [makePOLine({ received_quantity: 50, quantity: 100 })] }),
      );
      mockRepo.updateStatus.mockResolvedValue(makePO('CLOSED', { three_way_match_passed: false }));

      const cmd: ClosePOCommand = {
        poId: PO_ID,
        authorId: AUTHOR_ID,
        electronicSignature: makeSig(),
      };

      await useCase.closePO(cmd);
      expect(mockRepo.updateStatus).toHaveBeenCalledWith(
        expect.anything(),
        PO_ID,
        'CLOSED',
        expect.objectContaining({ three_way_match_passed: false }),
      );
    });
  });

  describe('cancelPO', () => {
    it('should cancel a DRAFT PO', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makePO('DRAFT'));
      mockRepo.updateStatus.mockResolvedValue(makePO('CANCELLED'));

      const cmd: CancelPOCommand = { poId: PO_ID, authorId: AUTHOR_ID, reason: 'Budget freeze' };

      const result = await useCase.cancelPO(cmd);
      expect(result.status).toBe('CANCELLED');
    });
  });
});
