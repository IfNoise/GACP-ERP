import { type PlantsController as PlantsControllerType } from './plants.controller';
import { type PlantsService } from './plants.service';
import { type QrService } from '../qr/qr.service';

const { PlantsController } = require('./plants.controller') as {
  PlantsController: new (...args: unknown[]) => PlantsControllerType;
};

const fakePlant = {
  id: 'plant-1',
  plant_code: 'PLT-001',
  batch_id: 'batch-1',
  strain_id: 'strain-1',
  current_stage: 'SEED',
  facility_id: 'facility-1',
};

describe('PlantsController', () => {
  let controller: PlantsControllerType;
  let plantsService: jest.Mocked<PlantsService>;
  let qrService: jest.Mocked<QrService>;

  beforeEach(() => {
    plantsService = {
      list: jest.fn(),
      getById: jest.fn(),
      getStageHistory: jest.fn(),
      create: jest.fn(),
      transitionStage: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<PlantsService>;

    qrService = {
      generatePlantQr: jest.fn(),
    } as unknown as jest.Mocked<QrService>;

    controller = new PlantsController(plantsService, qrService);
  });

  describe('list', () => {
    it('should parse query and call service.list', async () => {
      plantsService.list.mockResolvedValue({
        data: [],
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
      const query = { page: '1', limit: '20' };
      await controller.list(query);
      expect(plantsService.list).toHaveBeenCalledWith(
        {},
        expect.objectContaining({ page: 1, limit: 20 }),
      );
    });

    it('should pass batch_id filter', async () => {
      plantsService.list.mockResolvedValue({
        data: [],
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
      const query = { page: '1', limit: '20', batch_id: '00000000-0000-0000-0000-000000000001' };
      await controller.list(query);
      expect(plantsService.list).toHaveBeenCalledWith(
        expect.objectContaining({ batch_id: '00000000-0000-0000-0000-000000000001' }),
        expect.any(Object),
      );
    });
  });

  describe('getById', () => {
    it('should call service.getById', async () => {
      plantsService.getById.mockResolvedValue(fakePlant as never);
      const result = await controller.getById('plant-1');
      expect(result).toBe(fakePlant);
    });
  });

  describe('stageHistory', () => {
    it('should call service.getStageHistory', async () => {
      const history = [{ id: 'rec-1' }];
      plantsService.getStageHistory.mockResolvedValue(history as never);
      const result = await controller.stageHistory('plant-1');
      expect(result).toBe(history);
    });
  });

  describe('getQr', () => {
    it('should get plant and generate QR', async () => {
      plantsService.getById.mockResolvedValue(fakePlant as never);
      qrService.generatePlantQr.mockResolvedValue({
        dataUrl: 'data:image/png',
        url: 'https://...',
      } as never);

      const result = await controller.getQr('plant-1');
      expect(plantsService.getById).toHaveBeenCalledWith('plant-1');
      expect(qrService.generatePlantQr).toHaveBeenCalledWith('plant-1', 'PLT-001', 'facility-1');
      expect(result).toEqual(expect.objectContaining({ dataUrl: 'data:image/png' }));
    });
  });

  describe('create', () => {
    it('should call service.create with dto and userId', async () => {
      const dto = { plant_code: 'PLT-002', batch_id: 'b', strain_id: 's', facility_id: 'f' };
      plantsService.create.mockResolvedValue(fakePlant as never);
      const result = await controller.create(dto as never, 'user-1');
      expect(result).toBe(fakePlant);
      expect(plantsService.create).toHaveBeenCalledWith(dto, 'user-1');
    });

    it('should use system as default userId', async () => {
      const dto = { plant_code: 'PLT-002', batch_id: 'b', strain_id: 's', facility_id: 'f' };
      plantsService.create.mockResolvedValue(fakePlant as never);
      await controller.create(dto as never, undefined as unknown as string);
      expect(plantsService.create).toHaveBeenCalledWith(dto, 'system');
    });
  });

  describe('transitionStage', () => {
    it('should call service.transitionStage', async () => {
      const record = { id: 'rec-1' };
      plantsService.transitionStage.mockResolvedValue(record as never);
      const dto = { target_stage: 'GERMINATION' };

      const result = await controller.transitionStage('plant-1', dto as never, 'user-1');
      expect(result).toBe(record);
      expect(plantsService.transitionStage).toHaveBeenCalledWith(
        'plant-1',
        'GERMINATION',
        'user-1',
        undefined,
        undefined,
      );
    });
  });

  describe('update', () => {
    it('should call service.update', async () => {
      plantsService.update.mockResolvedValue(fakePlant as never);
      const result = await controller.update('plant-1', { notes: 'updated' } as never, 'user-2');
      expect(result).toBe(fakePlant);
      expect(plantsService.update).toHaveBeenCalledWith('plant-1', { notes: 'updated' }, 'user-2');
    });
  });

  describe('softDelete', () => {
    it('should call service.softDelete', async () => {
      plantsService.softDelete.mockResolvedValue(undefined);
      await controller.softDelete('plant-1', 'user-2');
      expect(plantsService.softDelete).toHaveBeenCalledWith('plant-1', 'user-2');
    });
  });
});
