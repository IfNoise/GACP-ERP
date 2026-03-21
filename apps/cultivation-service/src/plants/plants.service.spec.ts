import { NotFoundException } from '@nestjs/common';
import { type PlantsService as PlantsServiceType } from './plants.service';
import { type PlantsRepository } from './plants.repository';
import { type CreatePlantUseCase } from './use-cases/create-plant.use-case';
import { type TransitionStageUseCase } from './use-cases/transition-stage.use-case';

const { PlantsService } = require('./plants.service') as {
  PlantsService: new (...args: unknown[]) => PlantsServiceType;
};

const fakePlant = {
  id: 'plant-1',
  plant_code: 'PLT-001',
  batch_id: 'batch-1',
  strain_id: 'strain-1',
  current_stage: 'SEED',
  facility_id: 'facility-1',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  created_by: 'user-1',
  updated_by: 'user-1',
  is_deleted: false,
  deleted_at: null,
  deleted_by: null,
} as never;

describe('PlantsService', () => {
  let service: PlantsServiceType;
  let plantsRepo: jest.Mocked<PlantsRepository>;
  let createPlantUseCase: jest.Mocked<CreatePlantUseCase>;
  let transitionStageUseCase: jest.Mocked<TransitionStageUseCase>;

  beforeEach(() => {
    plantsRepo = {
      findById: jest.fn(),
      findManyByBatch: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      getStageHistory: jest.fn(),
    } as unknown as jest.Mocked<PlantsRepository>;

    createPlantUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreatePlantUseCase>;

    transitionStageUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<TransitionStageUseCase>;

    service = new PlantsService(plantsRepo, createPlantUseCase, transitionStageUseCase);
  });

  describe('getById', () => {
    it('should return plant when found', async () => {
      plantsRepo.findById.mockResolvedValue(fakePlant);
      const result = await service.getById('plant-1');
      expect(result).toBe(fakePlant);
      expect(plantsRepo.findById).toHaveBeenCalledWith('plant-1');
    });

    it('should throw NotFoundException when plant not found', async () => {
      plantsRepo.findById.mockResolvedValue(null);
      await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getByBatch', () => {
    it('should delegate to repository findManyByBatch', async () => {
      const paginatedResult = { data: [fakePlant], page: 1, limit: 10, total: 1, totalPages: 1 };
      plantsRepo.findManyByBatch.mockResolvedValue(paginatedResult);

      const pagination = { page: 1, limit: 10, sortOrder: 'desc' as const };
      const result = await service.getByBatch('batch-1', pagination);
      expect(result).toBe(paginatedResult);
      expect(plantsRepo.findManyByBatch).toHaveBeenCalledWith('batch-1', pagination);
    });
  });

  describe('create', () => {
    it('should delegate to createPlantUseCase', async () => {
      const dto = {
        plant_code: 'PLT-002',
        batch_id: 'b-1',
        strain_id: 's-1',
        facility_id: 'f-1',
      } as never;
      createPlantUseCase.execute.mockResolvedValue(fakePlant);

      const result = await service.create(dto, 'user-1');
      expect(result).toBe(fakePlant);
      expect(createPlantUseCase.execute).toHaveBeenCalledWith(dto, 'user-1');
    });
  });

  describe('transitionStage', () => {
    it('should delegate to transitionStageUseCase with all params', async () => {
      const record = { id: 'rec-1', from_stage: 'SEED', to_stage: 'GERMINATION' } as never;
      transitionStageUseCase.execute.mockResolvedValue(record);

      const sig = { signed_by: 'user-1', meaning: 'approve' } as never;
      const result = await service.transitionStage(
        'plant-1',
        'GERMINATION' as never,
        'user-1',
        'notes',
        sig,
      );
      expect(result).toBe(record);
      expect(transitionStageUseCase.execute).toHaveBeenCalledWith(
        'plant-1',
        'GERMINATION',
        'user-1',
        'notes',
        sig,
      );
    });

    it('should pass undefined for optional params', async () => {
      const record = { id: 'rec-1' } as never;
      transitionStageUseCase.execute.mockResolvedValue(record);

      await service.transitionStage('plant-1', 'GERMINATION' as never, 'user-1');
      expect(transitionStageUseCase.execute).toHaveBeenCalledWith(
        'plant-1',
        'GERMINATION',
        'user-1',
        undefined,
        undefined,
      );
    });
  });

  describe('getStageHistory', () => {
    it('should return history when plant exists', async () => {
      plantsRepo.findById.mockResolvedValue(fakePlant);
      const history = [{ id: 'rec-1', from_stage: 'SEED', to_stage: 'GERMINATION' }] as never;
      plantsRepo.getStageHistory.mockResolvedValue(history);

      const result = await service.getStageHistory('plant-1');
      expect(result).toBe(history);
      expect(plantsRepo.findById).toHaveBeenCalledWith('plant-1');
      expect(plantsRepo.getStageHistory).toHaveBeenCalledWith('plant-1');
    });

    it('should throw NotFoundException if plant does not exist', async () => {
      plantsRepo.findById.mockResolvedValue(null);
      await expect(service.getStageHistory('missing')).rejects.toThrow(NotFoundException);
      expect(plantsRepo.getStageHistory).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('should delegate to repository findMany', async () => {
      const paginatedResult = { data: [], page: 1, limit: 20, total: 0, totalPages: 0 };
      plantsRepo.findMany.mockResolvedValue(paginatedResult);

      const filters = { batch_id: 'b-1', stage: 'SEED' as never };
      const pagination = { page: 1, limit: 20, sortOrder: 'desc' as const };
      const result = await service.list(filters, pagination);
      expect(result).toBe(paginatedResult);
      expect(plantsRepo.findMany).toHaveBeenCalledWith(filters, pagination);
    });
  });

  describe('update', () => {
    it('should update plant when found', async () => {
      plantsRepo.findById.mockResolvedValue(fakePlant);
      const updated = { ...(fakePlant as Record<string, unknown>), notes: 'updated' } as never;
      plantsRepo.update.mockResolvedValue(updated);

      const result = await service.update('plant-1', { notes: 'updated' } as never, 'user-2');
      expect(result).toBe(updated);
      expect(plantsRepo.findById).toHaveBeenCalledWith('plant-1');
      expect(plantsRepo.update).toHaveBeenCalledWith('plant-1', { notes: 'updated' }, 'user-2');
    });

    it('should throw NotFoundException if plant does not exist for update', async () => {
      plantsRepo.findById.mockResolvedValue(null);
      await expect(service.update('missing', {} as never, 'user-2')).rejects.toThrow(
        NotFoundException,
      );
      expect(plantsRepo.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if repository update returns null', async () => {
      plantsRepo.findById.mockResolvedValue(fakePlant);
      plantsRepo.update.mockResolvedValue(null);

      await expect(service.update('plant-1', {} as never, 'user-2')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('softDelete', () => {
    it('should soft-delete plant when found', async () => {
      plantsRepo.findById.mockResolvedValue(fakePlant);
      plantsRepo.softDelete.mockResolvedValue(undefined);

      await service.softDelete('plant-1', 'user-2');
      expect(plantsRepo.findById).toHaveBeenCalledWith('plant-1');
      expect(plantsRepo.softDelete).toHaveBeenCalledWith('plant-1', 'user-2');
    });

    it('should throw NotFoundException if plant does not exist for delete', async () => {
      plantsRepo.findById.mockResolvedValue(null);
      await expect(service.softDelete('missing', 'user-2')).rejects.toThrow(NotFoundException);
      expect(plantsRepo.softDelete).not.toHaveBeenCalled();
    });
  });
});
