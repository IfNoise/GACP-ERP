import { type BatchesController as BatchesControllerType } from './batches.controller';
import { type BatchesService } from './batches.service';

const { BatchesController } = require('./batches.controller') as {
  BatchesController: new (...args: unknown[]) => BatchesControllerType;
};

const fakeBatch = {
  id: 'batch-1',
  batch_number: 'BATCH-001',
  strain_id: 'strain-1',
  status: 'ACTIVE',
  facility_id: 'facility-1',
};

describe('BatchesController', () => {
  let controller: BatchesControllerType;
  let batchesService: jest.Mocked<BatchesService>;

  beforeEach(() => {
    batchesService = {
      list: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
    } as unknown as jest.Mocked<BatchesService>;

    controller = new BatchesController(batchesService);
  });

  describe('list', () => {
    it('should parse query and call service.list', async () => {
      batchesService.list.mockResolvedValue([fakeBatch] as never);
      const query = {};
      const result = await controller.list(query);
      expect(result).toEqual([fakeBatch]);
      expect(batchesService.list).toHaveBeenCalledWith(undefined);
    });

    it('should pass facility_id filter', async () => {
      batchesService.list.mockResolvedValue([]);
      const query = { facility_id: '00000000-0000-0000-0000-000000000001' };
      await controller.list(query);
      expect(batchesService.list).toHaveBeenCalledWith('00000000-0000-0000-0000-000000000001');
    });
  });

  describe('getById', () => {
    it('should call service.getById', async () => {
      batchesService.getById.mockResolvedValue(fakeBatch as never);
      const result = await controller.getById('batch-1');
      expect(result).toBe(fakeBatch);
    });
  });

  describe('create', () => {
    it('should call service.create with dto and userId', async () => {
      const dto = {
        batch_number: 'BATCH-002',
        strain_id: 'strain-1',
        facility_id: 'facility-1',
        planned_plant_count: 50,
      };
      batchesService.create.mockResolvedValue(fakeBatch as never);
      const result = await controller.create(dto as never, 'user-1');
      expect(result).toBe(fakeBatch);
      expect(batchesService.create).toHaveBeenCalledWith(dto, 'user-1');
    });

    it('should use system when no userId header', async () => {
      batchesService.create.mockResolvedValue(fakeBatch as never);
      await controller.create({} as never, undefined as unknown as string);
      expect(batchesService.create).toHaveBeenCalledWith({}, 'system');
    });
  });

  describe('update', () => {
    it('should call service.update', async () => {
      batchesService.update.mockResolvedValue(fakeBatch as never);
      const result = await controller.update('batch-1', { notes: 'updated' } as never, 'user-2');
      expect(result).toBe(fakeBatch);
      expect(batchesService.update).toHaveBeenCalledWith('batch-1', { notes: 'updated' }, 'user-2');
    });
  });

  describe('updateStatus', () => {
    it('should call service.updateStatus', async () => {
      batchesService.updateStatus.mockResolvedValue(undefined);
      await controller.updateStatus('batch-1', { status: 'HARVESTING' } as never, 'user-2');
      expect(batchesService.updateStatus).toHaveBeenCalledWith('batch-1', 'HARVESTING', 'user-2');
    });

    it('should use system when no userId header', async () => {
      batchesService.updateStatus.mockResolvedValue(undefined);
      await controller.updateStatus(
        'batch-1',
        { status: 'HARVESTING' } as never,
        undefined as unknown as string,
      );
      expect(batchesService.updateStatus).toHaveBeenCalledWith('batch-1', 'HARVESTING', 'system');
    });
  });
});
