import { NotFoundException } from '@nestjs/common';
import { type ChangeControlRepository as ChangeControlRepositoryType } from './change-control.repository';

const { ChangeControlRepository } = require('./change-control.repository') as {
  ChangeControlRepository: new (...args: unknown[]) => ChangeControlRepositoryType;
};

function makeDbChains(rows: unknown[] = []) {
  const whereFn = jest.fn();
  const returningFn = jest.fn().mockResolvedValue(rows);
  const setFn = jest.fn();

  const selectChain = { from: jest.fn() };
  selectChain.from.mockReturnValue({
    where: whereFn.mockReturnValue({
      limit: jest.fn().mockResolvedValue(rows),
      orderBy: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          offset: jest.fn().mockResolvedValue(rows),
        }),
      }),
    }),
    orderBy: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        offset: jest.fn().mockResolvedValue(rows),
      }),
    }),
  });

  const insertChain = {
    values: jest.fn().mockReturnValue({ returning: returningFn }),
  };

  const updateChain = {
    set: setFn.mockReturnValue({
      where: jest.fn().mockReturnValue({ returning: returningFn }),
    }),
  };

  const db = {
    select: jest.fn().mockReturnValue(selectChain),
    insert: jest.fn().mockReturnValue(insertChain),
    update: jest.fn().mockReturnValue(updateChain),
    execute: jest.fn().mockResolvedValue({ rows: [{ nextval: '7' }] }),
  };

  return { db, returningFn, setFn };
}

const now = new Date();
const fakeRow = {
  id: 'cc-1',
  ccn_number: 'CCN-2026-0001',
  title: 'Change',
  description: 'Desc',
  change_type: 'MINOR',
  status: 'DRAFT',
  requestor_id: 'user-1',
  electronic_signature: null,
  validation_status: 'unvalidated',
  validation_protocol_id: null,
  last_validated_at: null,
  next_review_date: null,
  retention_class: '7_YEAR',
  audit_tx_id: null,
  created_at: now,
  updated_at: now,
  created_by: 'user-1',
  updated_by: 'user-1',
};

const fakeImpactRow = {
  id: 'imp-1',
  change_control_id: 'cc-1',
  area: 'Process',
  impact_description: 'Desc',
  risk_level: 'LOW',
  assessed_by: 'user-1',
  assessed_at: now,
};

const fakeApprovalRow = {
  id: 'ap-1',
  change_control_id: 'cc-1',
  approver_id: 'user-1',
  approval_level: 1,
  status: 'APPROVED',
  electronic_signature: null,
  decided_at: now,
};

describe('ChangeControlRepository', () => {
  describe('findById', () => {
    it('should return mapped CC when found', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new ChangeControlRepository(db as never);
      const result = await repo.findById('cc-1');
      expect(result).toBeDefined();
      expect(result!.id).toBe('cc-1');
    });

    it('should return null when not found', async () => {
      const { db } = makeDbChains([]);
      const repo = new ChangeControlRepository(db as never);
      expect(await repo.findById('x')).toBeNull();
    });
  });

  describe('findByIdOrThrow', () => {
    it('should throw NotFoundException when not found', async () => {
      const { db } = makeDbChains([]);
      const repo = new ChangeControlRepository(db as never);
      await expect(repo.findByIdOrThrow('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findMany', () => {
    it('should return paginated results', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new ChangeControlRepository(db as never);
      const result = await repo.findMany({}, { page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
    });

    it('should apply all filters', async () => {
      const { db } = makeDbChains([]);
      const repo = new ChangeControlRepository(db as never);
      await repo.findMany(
        { status: 'DRAFT' as never, requestor_id: 'u', change_type: 'MAJOR', search: 'q' },
        { page: 1, limit: 10 },
      );
      expect(db.select).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should insert and return mapped CC', async () => {
      const returningFn = jest.fn().mockResolvedValue([fakeRow]);
      const tx = {
        insert: jest
          .fn()
          .mockReturnValue({ values: jest.fn().mockReturnValue({ returning: returningFn }) }),
      };
      const { db } = makeDbChains();
      const repo = new ChangeControlRepository(db as never);

      const result = await repo.create(
        tx as never,
        {
          ccn_number: 'CCN-2026-0001',
          title: 'Change',
          description: 'Desc',
          change_type: 'MINOR',
          status: 'DRAFT',
          requestor_id: 'user-1',
          created_by: 'user-1',
          updated_by: 'user-1',
        } as never,
      );

      expect(result.id).toBe('cc-1');
    });
  });

  describe('update', () => {
    it('should update and return mapped CC', async () => {
      const returningFn = jest.fn().mockResolvedValue([fakeRow]);
      const tx = {
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({ returning: returningFn }),
          }),
        }),
      };
      const { db } = makeDbChains();
      const repo = new ChangeControlRepository(db as never);

      const result = await repo.update(tx as never, 'cc-1', {
        status: 'SUBMITTED',
        updated_by: 'u',
      } as never);
      expect(result.id).toBe('cc-1');
    });
  });

  describe('createImpact', () => {
    it('should insert and return impact', async () => {
      const returningFn = jest.fn().mockResolvedValue([fakeImpactRow]);
      const tx = {
        insert: jest
          .fn()
          .mockReturnValue({ values: jest.fn().mockReturnValue({ returning: returningFn }) }),
      };
      const { db } = makeDbChains();
      const repo = new ChangeControlRepository(db as never);

      const result = await repo.createImpact(
        tx as never,
        {
          change_control_id: 'cc-1',
          area: 'Process',
          impact_description: 'Desc',
          risk_level: 'LOW',
          assessed_by: 'user-1',
        } as never,
      );

      expect(result.id).toBe('imp-1');
      expect(result.assessed_at).toBe(now.toISOString());
    });
  });

  describe('findImpacts', () => {
    it('should return impacts for a CC', async () => {
      const whereFn = jest.fn().mockResolvedValue([fakeImpactRow]);
      const db = {
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: whereFn,
          }),
        }),
        execute: jest.fn(),
      };
      const repo = new ChangeControlRepository(db as never);
      const result = await repo.findImpacts('cc-1');
      expect(result).toHaveLength(1);
      expect(result[0]!.assessed_at).toBe(now.toISOString());
    });
  });

  describe('createApproval', () => {
    it('should insert and return approval', async () => {
      const returningFn = jest.fn().mockResolvedValue([fakeApprovalRow]);
      const tx = {
        insert: jest
          .fn()
          .mockReturnValue({ values: jest.fn().mockReturnValue({ returning: returningFn }) }),
      };
      const { db } = makeDbChains();
      const repo = new ChangeControlRepository(db as never);

      const result = await repo.createApproval(
        tx as never,
        {
          change_control_id: 'cc-1',
          approver_id: 'user-1',
          approval_level: 1,
          status: 'APPROVED',
          electronic_signature: null,
        } as never,
      );

      expect(result.id).toBe('ap-1');
    });
  });

  describe('findApprovals', () => {
    it('should return approvals for a CC', async () => {
      const whereFn = jest.fn().mockResolvedValue([fakeApprovalRow]);
      const db = {
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: whereFn,
          }),
        }),
        execute: jest.fn(),
      };
      const repo = new ChangeControlRepository(db as never);
      const result = await repo.findApprovals('cc-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('nextCcnNumber', () => {
    it('should return formatted CCN number', async () => {
      const { db } = makeDbChains();
      const repo = new ChangeControlRepository(db as never);
      const result = await repo.nextCcnNumber();
      expect(result).toMatch(/^CCN-\d{4}-0007$/);
    });
  });
});
