import { ConflictException } from '@nestjs/common';
import { SpatialPlanningUseCase } from './spatial-planning.use-case';
import type { FacilityZone, ZoneAssignment, UserId } from '@gacp-erp/shared-schemas';

// ─── FACTORIES ────────────────────────────────────────────────────────────────

const AUTHOR_ID = '00000000-0000-0000-0000-000000000099';
const ZONE_ID = '00000000-0000-0000-0000-000000000001';
const BATCH_ID = '00000000-0000-0000-0000-000000000002';
const ASSIGNMENT_ID = '00000000-0000-0000-0000-000000000003';

const makeZone = (overrides: Partial<FacilityZone> = {}): FacilityZone => ({
  id: ZONE_ID,
  zone_code: 'ZONE-00000001',
  zone_name: 'Drying Room A',
  zone_type: 'STORAGE',
  area_sqm: 50,
  capacity: 10,
  current_occupancy: 3,
  is_active: true,
  parent_zone_id: null,
  notes: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  created_by: AUTHOR_ID as UserId,
  updated_by: AUTHOR_ID as UserId,
  ...overrides,
});

const makeAssignment = (overrides: Partial<ZoneAssignment> = {}): ZoneAssignment => ({
  id: ASSIGNMENT_ID,
  zone_id: ZONE_ID,
  batch_id: BATCH_ID,
  assigned_at: '2026-01-10T00:00:00.000Z',
  assigned_by: AUTHOR_ID as UserId,
  released_at: null,
  released_by: null,
  notes: null,
  created_at: '2026-01-10T00:00:00.000Z',
  updated_at: '2026-01-10T00:00:00.000Z',
  created_by: AUTHOR_ID as UserId,
  updated_by: AUTHOR_ID as UserId,
  ...overrides,
});

// ─── MOCKS ────────────────────────────────────────────────────────────────────

const mockRepo = {
  nextZoneCode: jest.fn().mockResolvedValue('ZONE-00000001'),
  findZoneById: jest.fn().mockResolvedValue(makeZone()),
  findZoneByIdOrThrow: jest.fn().mockResolvedValue(makeZone()),
  findManyZones: jest.fn().mockResolvedValue([makeZone()]),
  createZone: jest.fn().mockResolvedValue(makeZone()),
  findActiveAssignmentForBatch: jest.fn().mockResolvedValue(null),
  assignBatch: jest.fn().mockResolvedValue(makeAssignment()),
  releaseBatch: jest
    .fn()
    .mockResolvedValue(
      makeAssignment({ released_at: '2026-02-01T00:00:00.000Z', released_by: AUTHOR_ID as UserId }),
    ),
  findAssignmentByIdOrThrow: jest.fn().mockResolvedValue(makeAssignment()),
};

const mockOutboxRepo = {
  createWithTx: jest.fn().mockResolvedValue(undefined),
};

const mockDb = {
  transaction: jest.fn().mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn({})),
};

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('SpatialPlanningUseCase', () => {
  let useCase: SpatialPlanningUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo.nextZoneCode.mockResolvedValue('ZONE-00000001');
    mockRepo.findZoneById.mockResolvedValue(makeZone());
    mockRepo.findZoneByIdOrThrow.mockResolvedValue(makeZone());
    mockRepo.findActiveAssignmentForBatch.mockResolvedValue(null);
    mockRepo.createZone.mockResolvedValue(makeZone());
    mockRepo.assignBatch.mockResolvedValue(makeAssignment());
    mockRepo.releaseBatch.mockResolvedValue(
      makeAssignment({ released_at: '2026-02-01T00:00:00.000Z', released_by: AUTHOR_ID as UserId }),
    );
    mockRepo.findAssignmentByIdOrThrow.mockResolvedValue(makeAssignment());
    mockDb.transaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn({}));

    useCase = new SpatialPlanningUseCase(
      mockDb as never,
      mockRepo as never,
      mockOutboxRepo as never,
    );
  });

  describe('createZone', () => {
    it('should create a zone and publish ZoneCreatedEvent', async () => {
      const dto = {
        zone_code: 'ZONE-TESTCODE',
        zone_name: 'Drying Room A',
        zone_type: 'STORAGE' as const,
        area_sqm: 50,
        capacity: 10,
      };

      const result = await useCase.createZone(dto, AUTHOR_ID);

      expect(result.zone_code).toBe('ZONE-00000001');
      expect(mockRepo.createZone).toHaveBeenCalledTimes(1);
      expect(mockDb.transaction).toHaveBeenCalledTimes(1);

      const [, eventArg] = mockOutboxRepo.createWithTx.mock.calls[0];
      expect(eventArg.topic).toBe('spatial.zone.v1');
      expect(eventArg.payload).toMatchObject({ eventType: 'spatial.zone.created' });
    });
  });

  describe('assignBatchToZone', () => {
    it('should assign a batch when zone has available capacity', async () => {
      // capacity=10, current_occupancy=3 → has room
      mockRepo.findZoneByIdOrThrow.mockResolvedValue(
        makeZone({ capacity: 10, current_occupancy: 3 }),
      );

      const dto = {
        zone_id: ZONE_ID,
        batch_id: BATCH_ID,
      };

      const result = await useCase.assignBatchToZone(dto, AUTHOR_ID);

      expect(result.batch_id).toBe(BATCH_ID);
      expect(mockRepo.assignBatch).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException when zone is at full capacity', async () => {
      // capacity = current_occupancy
      mockRepo.findZoneByIdOrThrow.mockResolvedValue(
        makeZone({ capacity: 10, current_occupancy: 10 }),
      );

      const dto = { zone_id: ZONE_ID, batch_id: BATCH_ID };

      await expect(useCase.assignBatchToZone(dto as never, AUTHOR_ID)).rejects.toThrow(
        ConflictException,
      );
      expect(mockRepo.assignBatch).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when batch is already assigned to another zone', async () => {
      // Zone has capacity
      mockRepo.findZoneByIdOrThrow.mockResolvedValue(
        makeZone({ capacity: 10, current_occupancy: 3 }),
      );
      // Batch already assigned
      mockRepo.findActiveAssignmentForBatch.mockResolvedValue(
        makeAssignment({ zone_id: 'another-zone' }),
      );

      const dto = { zone_id: ZONE_ID, batch_id: BATCH_ID };

      await expect(useCase.assignBatchToZone(dto as never, AUTHOR_ID)).rejects.toThrow(
        ConflictException,
      );
      expect(mockRepo.assignBatch).not.toHaveBeenCalled();
    });

    it('should publish BatchAssignedToZoneEvent', async () => {
      mockRepo.findZoneByIdOrThrow.mockResolvedValue(
        makeZone({ capacity: 10, current_occupancy: 0 }),
      );

      const dto = { zone_id: ZONE_ID, batch_id: BATCH_ID };

      await useCase.assignBatchToZone(dto as never, AUTHOR_ID);

      const [, eventArg] = mockOutboxRepo.createWithTx.mock.calls[0];
      expect(eventArg.payload).toMatchObject({ eventType: 'spatial.zone.batch_assigned' });
    });

    it('should set occupancyAfterPct to 0 when zone has no capacity', async () => {
      mockRepo.findZoneByIdOrThrow.mockResolvedValue(
        makeZone({ capacity: null, current_occupancy: 0 }),
      );

      const dto = { zone_id: ZONE_ID, batch_id: BATCH_ID };

      await useCase.assignBatchToZone(dto as never, AUTHOR_ID);

      const [, eventArg] = mockOutboxRepo.createWithTx.mock.calls[0];
      expect(eventArg.payload.payload.occupancyAfterPct).toBe(0);
    });
  });

  describe('releaseBatchFromZone', () => {
    it('should release a batch from zone and publish event', async () => {
      const dto = {
        assignment_id: ASSIGNMENT_ID,
      };

      const result = await useCase.releaseBatchFromZone(dto, AUTHOR_ID);

      expect(result.released_at).toBeDefined();
      expect(mockRepo.releaseBatch).toHaveBeenCalledTimes(1);
      expect(mockDb.transaction).toHaveBeenCalledTimes(1);

      const [, eventArg] = mockOutboxRepo.createWithTx.mock.calls[0];
      expect(eventArg.payload).toMatchObject({ eventType: 'spatial.zone.batch_released' });
    });

    it('should handle null zone (zone deleted after assignment)', async () => {
      mockRepo.findZoneById.mockResolvedValue(null);

      const dto = { assignment_id: ASSIGNMENT_ID };
      const result = await useCase.releaseBatchFromZone(dto, AUTHOR_ID);

      expect(result.released_at).toBeDefined();
      const [, eventArg] = mockOutboxRepo.createWithTx.mock.calls[0];
      expect(eventArg.payload.payload.zoneCode).toBe('');
      expect(eventArg.payload.payload.zoneType).toBe('STORAGE');
      expect(eventArg.payload.payload.occupancyAfterPct).toBe(0);
    });
  });
});
