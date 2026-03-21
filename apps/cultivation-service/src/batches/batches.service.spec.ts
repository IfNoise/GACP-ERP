import { NotFoundException, BadRequestException } from '@nestjs/common';
import { type BatchesService as BatchesServiceType } from './batches.service';
import { type BatchesRepository } from './batches.repository';
import { type KafkaProducerService } from '../kafka/kafka-producer.service';

const { BatchesService } = require('./batches.service') as {
  BatchesService: new (...args: unknown[]) => BatchesServiceType;
};

const fakeBatch = {
  id: 'batch-1',
  batch_number: 'BATCH-001',
  parent_batch_id: null,
  strain_id: 'strain-1',
  status: 'ACTIVE',
  compliance_status: 'pending',
  facility_id: 'facility-1',
  zone_id: 'zone-1',
  planned_plant_count: 100,
  actual_plant_count: 0,
  notes: undefined,
  planned_start_date: '2026-01-01T00:00:00.000Z',
  planned_harvest_date: '2026-06-01T00:00:00.000Z',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  created_by: 'user-1',
  updated_by: 'user-1',
  is_deleted: false,
  deleted_at: null,
  deleted_by: null,
} as never;

describe('BatchesService', () => {
  let service: BatchesServiceType;
  let batchesRepo: jest.Mocked<BatchesRepository>;
  let kafkaProducer: jest.Mocked<KafkaProducerService>;

  beforeEach(() => {
    batchesRepo = {
      findById: jest.fn(),
      findByBatchNumber: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      updateFields: jest.fn(),
      updateStatus: jest.fn(),
    } as unknown as jest.Mocked<BatchesRepository>;

    kafkaProducer = {
      publish: jest.fn(),
    } as unknown as jest.Mocked<KafkaProducerService>;

    service = new BatchesService(batchesRepo, kafkaProducer);
  });

  describe('getById', () => {
    it('should return batch when found', async () => {
      batchesRepo.findById.mockResolvedValue(fakeBatch);
      const result = await service.getById('batch-1');
      expect(result).toBe(fakeBatch);
    });

    it('should throw NotFoundException when not found', async () => {
      batchesRepo.findById.mockResolvedValue(null);
      await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('should return batches filtered by facility', async () => {
      batchesRepo.findMany.mockResolvedValue([fakeBatch]);
      const result = await service.list('facility-1');
      expect(result).toEqual([fakeBatch]);
      expect(batchesRepo.findMany).toHaveBeenCalledWith('facility-1');
    });

    it('should return all batches when no facility specified', async () => {
      batchesRepo.findMany.mockResolvedValue([]);
      const result = await service.list();
      expect(result).toEqual([]);
      expect(batchesRepo.findMany).toHaveBeenCalledWith(undefined);
    });
  });

  describe('create', () => {
    const createDto = {
      batch_number: 'BATCH-002',
      strain_id: 'strain-1',
      facility_id: 'facility-1',
      zone_id: 'zone-1',
      planned_plant_count: 50,
    } as never;

    it('should create batch and publish event', async () => {
      batchesRepo.findByBatchNumber.mockResolvedValue(null);
      batchesRepo.create.mockResolvedValue(fakeBatch);

      const result = await service.create(createDto, 'user-1');
      expect(result).toBe(fakeBatch);
      expect(batchesRepo.create).toHaveBeenCalledWith(createDto, 'user-1');
      expect(kafkaProducer.publish).toHaveBeenCalledWith(
        expect.any(String),
        'batch-1',
        expect.objectContaining({
          eventType: 'BATCH_CREATED',
          payload: expect.objectContaining({
            batchId: 'batch-1',
            batchNumber: 'BATCH-001',
          }),
        }),
      );
    });

    it('should throw BadRequestException for duplicate batch numbers', async () => {
      batchesRepo.findByBatchNumber.mockResolvedValue(fakeBatch);
      await expect(service.create(createDto, 'user-1')).rejects.toThrow(BadRequestException);
      expect(batchesRepo.create).not.toHaveBeenCalled();
      expect(kafkaProducer.publish).not.toHaveBeenCalled();
    });

    it('should set propagationMethod to seed when no parent_batch_id', async () => {
      batchesRepo.findByBatchNumber.mockResolvedValue(null);
      batchesRepo.create.mockResolvedValue(fakeBatch);

      await service.create(createDto, 'user-1');
      expect(kafkaProducer.publish).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          payload: expect.objectContaining({ propagationMethod: 'seed' }),
        }),
      );
    });

    it('should set propagationMethod to clone when parent_batch_id exists', async () => {
      const batchWithParent = {
        ...(fakeBatch as Record<string, unknown>),
        parent_batch_id: 'parent-1',
      } as never;
      batchesRepo.findByBatchNumber.mockResolvedValue(null);
      batchesRepo.create.mockResolvedValue(batchWithParent);

      await service.create(createDto, 'user-1');
      expect(kafkaProducer.publish).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          payload: expect.objectContaining({ propagationMethod: 'clone' }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should update batch fields and return updated', async () => {
      const updated = { ...(fakeBatch as Record<string, unknown>), notes: 'updated' } as never;
      batchesRepo.findById.mockResolvedValueOnce(fakeBatch).mockResolvedValueOnce(updated);
      batchesRepo.updateFields.mockResolvedValue(undefined);

      const result = await service.update('batch-1', { notes: 'updated' } as never, 'user-2');
      expect(result).toBe(updated);
      expect(batchesRepo.updateFields).toHaveBeenCalledWith(
        'batch-1',
        { notes: 'updated' },
        'user-2',
      );
    });

    it('should throw NotFoundException if batch not found', async () => {
      batchesRepo.findById.mockResolvedValue(null);
      await expect(service.update('missing', {} as never, 'user-2')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update status and publish event', async () => {
      batchesRepo.findById.mockResolvedValue(fakeBatch);
      batchesRepo.updateStatus.mockResolvedValue(undefined);

      await service.updateStatus('batch-1', 'HARVESTING' as never, 'user-2');
      expect(batchesRepo.updateStatus).toHaveBeenCalledWith('batch-1', 'HARVESTING', 'user-2');
      expect(kafkaProducer.publish).toHaveBeenCalledWith(
        expect.any(String),
        'batch-1',
        expect.objectContaining({
          eventType: 'BATCH_STATUS_CHANGED',
          payload: expect.objectContaining({
            batchId: 'batch-1',
            previousStatus: 'ACTIVE',
            newStatus: 'HARVESTING',
          }),
        }),
      );
    });

    it('should throw NotFoundException if batch not found for status update', async () => {
      batchesRepo.findById.mockResolvedValue(null);
      await expect(
        service.updateStatus('missing', 'HARVESTING' as never, 'user-2'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
