import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import {
  type Batch,
  type CreateBatch,
  type UpdateBatch,
  type BatchStatus,
} from '@gacp-erp/shared-schemas';
import { type BatchesRepository } from './batches.repository';

@Injectable()
export class BatchesService {
  private readonly logger = new Logger(BatchesService.name);

  constructor(private readonly batchesRepo: BatchesRepository) {}

  async getById(id: string): Promise<Batch> {
    const batch = await this.batchesRepo.findById(id);
    if (!batch) throw new NotFoundException(`Batch ${id} not found`);
    return batch;
  }

  async list(facilityId?: string): Promise<Batch[]> {
    return this.batchesRepo.findMany(facilityId);
  }

  async create(dto: CreateBatch, createdBy: string): Promise<Batch> {
    const existing = await this.batchesRepo.findByBatchNumber(dto.batch_number);
    if (existing) {
      throw new BadRequestException(`Batch number "${dto.batch_number}" already exists`);
    }
    const batch = await this.batchesRepo.create(dto, createdBy);
    this.logger.log(`Batch created: ${batch.id} (${batch.batch_number})`);
    return batch;
  }

  async update(id: string, dto: UpdateBatch, updatedBy: string): Promise<Batch> {
    await this.getById(id); // throws NotFoundException if not found
    await this.batchesRepo.updateFields(id, dto, updatedBy);
    return this.getById(id);
  }

  async updateStatus(id: string, status: BatchStatus, updatedBy: string): Promise<void> {
    await this.getById(id); // throws NotFoundException if not found
    // BatchStatus values match batchesTable status enum values
    await this.batchesRepo.updateStatus(id, status as never, updatedBy);
  }
}
