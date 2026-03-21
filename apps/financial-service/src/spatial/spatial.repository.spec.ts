import { NotFoundException, ConflictException } from '@nestjs/common';
import { type SpatialRepository as SpatialRepositoryType } from './spatial.repository';

const { SpatialRepository } = require('./spatial.repository') as {
  SpatialRepository: new (...args: unknown[]) => SpatialRepositoryType;
};

const now = new Date();

const fakeZoneRow = {
  id: 'zone-1',
  zone_code: 'ZONE-00000001',
  zone_name: 'Zone A',
  zone_type: 'CULTIVATION',
  area_sqm: '50.00',
  capacity: 10,
  parent_zone_id: null,
  is_active: true,
  current_occupancy: 2,
  notes: null,
  created_at: now,
  updated_at: now,
  created_by: 'user-1',
  updated_by: 'user-1',
};

const fakeAssignmentRow = {
  id: 'assign-1',
  zone_id: 'zone-1',
  batch_id: 'batch-1',
  assigned_at: now,
  assigned_by: 'user-1',
  released_at: null,
  released_by: null,
  notes: null,
  created_at: now,
  updated_at: now,
  created_by: 'user-1',
  updated_by: 'user-1',
};

function makeDbChains(rows: unknown[] = []) {
  const limitFn = jest.fn().mockResolvedValue(rows);
  const offsetFn = jest.fn().mockResolvedValue(rows);
  const orderByFn = jest
    .fn()
    .mockReturnValue({ limit: jest.fn().mockReturnValue({ offset: offsetFn }) });
  const whereFn = jest.fn().mockReturnValue({ limit: limitFn, orderBy: orderByFn });
  const fromFn = jest.fn().mockReturnValue({ where: whereFn });

  const returningFn = jest.fn().mockResolvedValue(rows);
  const insertChain = {
    values: jest.fn().mockReturnValue({ returning: returningFn }),
  };

  const setFn = jest.fn().mockReturnValue({
    where: jest.fn().mockResolvedValue(undefined),
  });

  const db = {
    select: jest.fn().mockReturnValue({ from: fromFn }),
    insert: jest.fn().mockReturnValue(insertChain),
    update: jest.fn().mockReturnValue({ set: setFn }),
    execute: jest.fn().mockResolvedValue({ rows: [{ nextval: '1' }] }),
  };

  return { db, setFn };
}

describe('SpatialRepository', () => {
  describe('nextZoneCode', () => {
    it('should return formatted zone code', async () => {
      const { db } = makeDbChains();
      const repo = new SpatialRepository(db as never);
      const result = await repo.nextZoneCode();
      expect(result).toBe('ZONE-00000001');
    });
  });

  describe('findZoneById', () => {
    it('should return mapped zone when found', async () => {
      const { db } = makeDbChains([fakeZoneRow]);
      const repo = new SpatialRepository(db as never);
      const result = await repo.findZoneById('zone-1');
      expect(result).not.toBeNull();
      expect(result!.zone_code).toBe('ZONE-00000001');
      expect(result!.area_sqm).toBe(50);
    });

    it('should return null when not found', async () => {
      const { db } = makeDbChains([]);
      const repo = new SpatialRepository(db as never);
      expect(await repo.findZoneById('missing')).toBeNull();
    });
  });

  describe('findZoneByIdOrThrow', () => {
    it('should throw NotFoundException', async () => {
      const { db } = makeDbChains([]);
      const repo = new SpatialRepository(db as never);
      await expect(repo.findZoneByIdOrThrow('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findManyZones', () => {
    it('should return paginated results', async () => {
      const { db } = makeDbChains([fakeZoneRow]);
      const repo = new SpatialRepository(db as never);
      const result = await repo.findManyZones({}, { page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
    });

    it('should apply filters', async () => {
      const { db } = makeDbChains([fakeZoneRow]);
      const repo = new SpatialRepository(db as never);
      const result = await repo.findManyZones(
        { zone_type: 'CULTIVATION' as never, is_active: true },
        { page: 1, limit: 10 },
      );
      expect(result.data).toHaveLength(1);
    });
  });

  describe('createZone', () => {
    it('should insert and return mapped zone', async () => {
      const { db } = makeDbChains([fakeZoneRow]);
      const repo = new SpatialRepository(db as never);
      const result = await repo.createZone(db as never, {
        zone_code: 'ZONE-00000001',
        zone_name: 'Zone A',
        zone_type: 'CULTIVATION' as never,
        area_sqm: 50,
        capacity: 10,
        parent_zone_id: null,
        is_active: true,
        current_occupancy: 0,
        notes: null,
        created_by: 'user-1' as never,
        updated_by: 'user-1' as never,
      });
      expect(result.zone_name).toBe('Zone A');
    });
  });

  describe('findAssignmentById', () => {
    it('should return mapped assignment', async () => {
      const { db } = makeDbChains([fakeAssignmentRow]);
      const repo = new SpatialRepository(db as never);
      const result = await repo.findAssignmentById('assign-1');
      expect(result).not.toBeNull();
      expect(result!.zone_id).toBe('zone-1');
    });

    it('should return null when not found', async () => {
      const { db } = makeDbChains([]);
      const repo = new SpatialRepository(db as never);
      expect(await repo.findAssignmentById('missing')).toBeNull();
    });
  });

  describe('findAssignmentByIdOrThrow', () => {
    it('should throw NotFoundException', async () => {
      const { db } = makeDbChains([]);
      const repo = new SpatialRepository(db as never);
      await expect(repo.findAssignmentByIdOrThrow('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findActiveAssignmentForBatch', () => {
    it('should return active assignment', async () => {
      const { db } = makeDbChains([fakeAssignmentRow]);
      const repo = new SpatialRepository(db as never);
      const result = await repo.findActiveAssignmentForBatch('batch-1');
      expect(result).not.toBeNull();
    });

    it('should return null when no active assignment', async () => {
      const { db } = makeDbChains([]);
      const repo = new SpatialRepository(db as never);
      expect(await repo.findActiveAssignmentForBatch('batch-1')).toBeNull();
    });
  });

  describe('listActiveAssignmentsForZone', () => {
    it('should return paginated assignments', async () => {
      const { db } = makeDbChains([fakeAssignmentRow]);
      const repo = new SpatialRepository(db as never);
      const result = await repo.listActiveAssignmentsForZone('zone-1', { page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
    });
  });

  describe('assignBatch', () => {
    it('should insert assignment and increment occupancy', async () => {
      const returningFn = jest.fn().mockResolvedValue([fakeAssignmentRow]);
      const setFn = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });
      const tx = {
        insert: jest.fn().mockReturnValue({
          values: jest.fn().mockReturnValue({ returning: returningFn }),
        }),
        update: jest.fn().mockReturnValue({ set: setFn }),
      };
      const db = { execute: jest.fn(), select: jest.fn() };
      const repo = new SpatialRepository(db as never);
      const result = await repo.assignBatch(tx as never, {
        zone_id: 'zone-1',
        batch_id: 'batch-1',
        assigned_at: now.toISOString(),
        assigned_by: 'user-1' as never,
        notes: null,
        created_by: 'user-1' as never,
        updated_by: 'user-1' as never,
      });
      expect(result.zone_id).toBe('zone-1');
      expect(tx.update).toHaveBeenCalled();
    });
  });

  describe('releaseBatch', () => {
    it('should throw ConflictException if already released', async () => {
      const releasedRow = { ...fakeAssignmentRow, released_at: now };
      const { db } = makeDbChains([releasedRow]);
      const repo = new SpatialRepository(db as never);
      await expect(repo.releaseBatch(db as never, 'assign-1', 'user-1' as never)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should update assignment and decrement occupancy', async () => {
      // findAssignmentByIdOrThrow: returns unreleased assignment
      let selectCallCount = 0;
      const fromFn = jest.fn().mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return {
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([fakeAssignmentRow]),
            }),
          };
        }
        // findAssignmentById after release
        return {
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ ...fakeAssignmentRow, released_at: now }]),
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

      const repo = new SpatialRepository(db as never);
      const result = await repo.releaseBatch(tx as never, 'assign-1', 'user-1' as never, 'Done');
      expect(result).not.toBeNull();
      expect(tx.update).toHaveBeenCalledTimes(2); // assignment + zone occupancy
    });
  });
});
