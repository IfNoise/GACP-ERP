import { type SpatialController as SpatialControllerType } from './spatial.controller';

const { SpatialController } = require('./spatial.controller') as {
  SpatialController: new (...args: unknown[]) => SpatialControllerType;
};

const mockRepo = {
  findManyZones: jest
    .fn()
    .mockResolvedValue({ data: [], page: 1, limit: 10, total: 0, totalPages: 0 }),
  findZoneByIdOrThrow: jest.fn().mockResolvedValue({ id: 'zone-1' }),
  findAssignmentByIdOrThrow: jest.fn().mockResolvedValue({ id: 'assign-1' }),
  listActiveAssignmentsForZone: jest
    .fn()
    .mockResolvedValue({ data: [], page: 1, limit: 10, total: 0, totalPages: 0 }),
};

const mockPlanningUseCase = {
  createZone: jest.fn().mockResolvedValue({ id: 'zone-1' }),
  assignBatchToZone: jest.fn().mockResolvedValue({ id: 'assign-1' }),
  releaseBatchFromZone: jest.fn().mockResolvedValue({ id: 'assign-1' }),
};

describe('SpatialController', () => {
  let ctrl: SpatialControllerType;

  beforeEach(() => {
    jest.clearAllMocks();
    ctrl = new SpatialController(mockRepo as never, mockPlanningUseCase as never);
  });

  describe('createZone', () => {
    it('should delegate to use case', () => {
      ctrl.createZone({ zone_name: 'Zone A', zone_type: 'CULTIVATION' } as never, 'user-1');
      expect(mockPlanningUseCase.createZone).toHaveBeenCalled();
    });

    it('should default userId to system', () => {
      ctrl.createZone({ zone_name: 'Zone A' } as never, undefined as never);
      expect(mockPlanningUseCase.createZone).toHaveBeenCalledWith(expect.anything(), 'system');
    });
  });

  describe('listZones', () => {
    it('should pass parsed query to repo', () => {
      ctrl.listZones({ page: '1', limit: '10' });
      expect(mockRepo.findManyZones).toHaveBeenCalledWith(
        {},
        expect.objectContaining({ page: 1, limit: 10 }),
      );
    });

    it('should pass filters', () => {
      ctrl.listZones({ page: '1', limit: '10', zone_type: 'CULTIVATION', is_active: 'true' });
      expect(mockRepo.findManyZones).toHaveBeenCalledWith(
        expect.objectContaining({ zone_type: 'CULTIVATION', is_active: true }),
        expect.objectContaining({ page: 1 }),
      );
    });
  });

  describe('getZone', () => {
    it('should delegate to repo', () => {
      ctrl.getZone('zone-1');
      expect(mockRepo.findZoneByIdOrThrow).toHaveBeenCalledWith('zone-1');
    });
  });

  describe('assignBatch', () => {
    it('should delegate to use case', () => {
      ctrl.assignBatch({ zone_id: 'zone-1', batch_id: 'batch-1' } as never, 'user-1');
      expect(mockPlanningUseCase.assignBatchToZone).toHaveBeenCalled();
    });

    it('should default userId to system', () => {
      ctrl.assignBatch({ zone_id: 'zone-1', batch_id: 'batch-1' } as never, undefined as never);
      expect(mockPlanningUseCase.assignBatchToZone).toHaveBeenCalledWith(
        expect.anything(),
        'system',
      );
    });
  });

  describe('getAssignment', () => {
    it('should delegate to repo', () => {
      ctrl.getAssignment('assign-1');
      expect(mockRepo.findAssignmentByIdOrThrow).toHaveBeenCalledWith('assign-1');
    });
  });

  describe('releaseBatch', () => {
    it('should delegate to use case with assignment_id', () => {
      ctrl.releaseBatch('assign-1', {} as never, 'user-1');
      expect(mockPlanningUseCase.releaseBatchFromZone).toHaveBeenCalledWith(
        expect.objectContaining({ assignment_id: 'assign-1' }),
        'user-1',
      );
    });

    it('should default userId to system', () => {
      ctrl.releaseBatch('assign-1', {} as never, undefined as never);
      expect(mockPlanningUseCase.releaseBatchFromZone).toHaveBeenCalledWith(
        expect.anything(),
        'system',
      );
    });
  });

  describe('listActiveAssignments', () => {
    it('should delegate to repo', () => {
      ctrl.listActiveAssignments('zone-1', { page: '1', limit: '10' });
      expect(mockRepo.listActiveAssignmentsForZone).toHaveBeenCalledWith(
        'zone-1',
        expect.objectContaining({ page: 1, limit: 10 }),
      );
    });
  });
});
