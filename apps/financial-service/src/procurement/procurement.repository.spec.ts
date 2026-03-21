import { NotFoundException } from '@nestjs/common';
import { type ProcurementRepository as ProcurementRepositoryType } from './procurement.repository';

const { ProcurementRepository } = require('./procurement.repository') as {
  ProcurementRepository: new (...args: unknown[]) => ProcurementRepositoryType;
};

const now = new Date();

const fakeOrderRow = {
  id: 'po-1',
  po_number: 'PO-2026-0001',
  supplier_id: 'sup-1',
  status: 'DRAFT',
  total_value: '1000.00',
  currency: 'USD',
  expected_delivery_date: now,
  three_way_match_passed: null,
  electronic_signature: null,
  notes: null,
  created_at: now,
  updated_at: now,
  created_by: 'user-1',
  updated_by: 'user-1',
};

const fakeLineRow = {
  id: 'pol-1',
  po_id: 'po-1',
  line_number: 1,
  item_description: 'Seeds',
  quantity: '100.00',
  unit_price: '10.00',
  unit_of_measure: 'kg',
  received_quantity: '0.00',
};

const fakeRecRow = {
  id: 'grn-1',
  grn_number: 'GRN-2026-0001',
  po_id: 'po-1',
  received_at: now,
  received_by: 'user-1',
  quality_check_passed: true,
  electronic_signature: {},
  created_at: now,
  updated_at: now,
  created_by: 'user-1',
  updated_by: 'user-1',
};

const fakeRecLineRow = {
  id: 'grl-1',
  grn_id: 'grn-1',
  po_line_id: 'pol-1',
  received_quantity: '50.00',
  notes: null,
};

describe('ProcurementRepository', () => {
  describe('nextPoNumber', () => {
    it('should return formatted PO number', async () => {
      const db = {
        execute: jest.fn().mockResolvedValue({ rows: [{ nextval: '7' }] }),
        select: jest.fn(),
      };
      const repo = new ProcurementRepository(db as never);
      const result = await repo.nextPoNumber();
      expect(result).toMatch(/^PO-\d{4}-0007$/);
    });
  });

  describe('nextGrnNumber', () => {
    it('should return formatted GRN number', async () => {
      const db = {
        execute: jest.fn().mockResolvedValue({ rows: [{ nextval: '3' }] }),
        select: jest.fn(),
      };
      const repo = new ProcurementRepository(db as never);
      const result = await repo.nextGrnNumber();
      expect(result).toMatch(/^GRN-\d{4}-0003$/);
    });
  });

  describe('findById', () => {
    it('should return PO with lines when found', async () => {
      let selectCallCount = 0;
      const fromFn = jest.fn().mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return {
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([fakeOrderRow]),
            }),
          };
        }
        return {
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([fakeLineRow]),
          }),
        };
      });
      const db = {
        select: jest.fn().mockReturnValue({ from: fromFn }),
        execute: jest.fn(),
      };
      const repo = new ProcurementRepository(db as never);
      const result = await repo.findById('po-1');
      expect(result).not.toBeNull();
      expect(result!.po_number).toBe('PO-2026-0001');
      expect(result!.lines).toHaveLength(1);
      expect(result!.total_value).toBe(1000);
    });

    it('should return null when not found', async () => {
      const fromFn = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      });
      const db = {
        select: jest.fn().mockReturnValue({ from: fromFn }),
        execute: jest.fn(),
      };
      const repo = new ProcurementRepository(db as never);
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  describe('findByIdOrThrow', () => {
    it('should throw NotFoundException', async () => {
      const fromFn = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      });
      const db = {
        select: jest.fn().mockReturnValue({ from: fromFn }),
        execute: jest.fn(),
      };
      const repo = new ProcurementRepository(db as never);
      await expect(repo.findByIdOrThrow('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findMany', () => {
    it('should return paginated results', async () => {
      let selectCallCount = 0;
      const fromFn = jest.fn().mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return {
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  offset: jest.fn().mockResolvedValue([fakeOrderRow]),
                }),
              }),
            }),
          };
        }
        return {
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([fakeLineRow]),
          }),
        };
      });
      const db = {
        select: jest.fn().mockReturnValue({ from: fromFn }),
        execute: jest.fn(),
      };
      const repo = new ProcurementRepository(db as never);
      const result = await repo.findMany({}, { page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
    });

    it('should apply filters', async () => {
      let selectCallCount = 0;
      const fromFn = jest.fn().mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return {
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  offset: jest.fn().mockResolvedValue([fakeOrderRow]),
                }),
              }),
            }),
          };
        }
        return {
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([fakeLineRow]),
          }),
        };
      });
      const db = {
        select: jest.fn().mockReturnValue({ from: fromFn }),
        execute: jest.fn(),
      };
      const repo = new ProcurementRepository(db as never);
      const result = await repo.findMany(
        { status: 'DRAFT' as never, supplier_id: 'sup-1' },
        { page: 1, limit: 10 },
      );
      expect(result.data).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should insert order and lines', async () => {
      const returningFn = jest.fn();
      returningFn.mockResolvedValueOnce([fakeOrderRow]).mockResolvedValueOnce([fakeLineRow]);

      const tx = {
        insert: jest.fn().mockReturnValue({
          values: jest.fn().mockReturnValue({ returning: returningFn }),
        }),
      };
      const db = { execute: jest.fn(), select: jest.fn() };
      const repo = new ProcurementRepository(db as never);
      const result = await repo.create(tx as never, {
        po_number: 'PO-2026-0001',
        supplier_id: 'sup-1',
        status: 'DRAFT' as never,
        total_value: 1000,
        currency: 'USD',
        expected_delivery_date: now.toISOString(),
        three_way_match_passed: null,
        electronic_signature: null,
        notes: null,
        lines: [
          {
            id: 'pol-1',
            po_id: 'po-1',
            line_number: 1,
            item_description: 'Seeds',
            quantity: 100,
            unit_price: 10,
            unit_of_measure: 'kg',
            received_quantity: 0,
          },
        ],
        created_by: 'user-1' as never,
        updated_by: 'user-1' as never,
      });
      expect(result.po_number).toBe('PO-2026-0001');
      expect(result.lines).toHaveLength(1);
    });
  });

  describe('updateStatus', () => {
    it('should update status and return PO', async () => {
      let selectCallCount = 0;
      const fromFn = jest.fn().mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return {
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ ...fakeOrderRow, status: 'SUBMITTED' }]),
            }),
          };
        }
        return {
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([fakeLineRow]),
          }),
        };
      });

      const setFn = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      const db = {
        select: jest.fn().mockReturnValue({ from: fromFn }),
        execute: jest.fn(),
      };
      const tx = {
        update: jest.fn().mockReturnValue({ set: setFn }),
      };

      const repo = new ProcurementRepository(db as never);
      const result = await repo.updateStatus(tx as never, 'po-1', 'SUBMITTED' as never, {
        updated_by: 'user-1' as never,
      });
      expect(result.status).toBe('SUBMITTED');
    });
  });

  describe('addReceivingRecord', () => {
    it('should insert receiving record and lines', async () => {
      const returningFn = jest.fn();
      returningFn.mockResolvedValueOnce([fakeRecRow]).mockResolvedValueOnce([fakeRecLineRow]);

      const tx = {
        insert: jest.fn().mockReturnValue({
          values: jest.fn().mockReturnValue({ returning: returningFn }),
        }),
      };
      const db = { execute: jest.fn(), select: jest.fn() };
      const repo = new ProcurementRepository(db as never);
      const result = await repo.addReceivingRecord(tx as never, {
        grn_number: 'GRN-2026-0001',
        po_id: 'po-1',
        received_at: now.toISOString(),
        received_by: 'user-1' as never,
        lines: [
          {
            id: 'grl-1',
            receiving_record_id: 'grn-1',
            po_line_id: 'pol-1',
            quantity_received: 50,
            condition_notes: null,
          },
        ],
        quality_check_passed: true,
        quality_check_notes: null,
        electronic_signature: {} as never,
        created_by: 'user-1' as never,
        updated_by: 'user-1' as never,
      });
      expect(result.grn_number).toBe('GRN-2026-0001');
      expect(result.lines).toHaveLength(1);
      expect(result.lines[0]!.quantity_received).toBe(50);
    });
  });
});
