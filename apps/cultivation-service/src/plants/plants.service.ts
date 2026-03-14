import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import {
  type Plant,
  type CreatePlant,
  type PlantStageTransitionRecord,
  type ElectronicSignature,
  type PaginationQuery,
  type PaginatedResponse,
  type GrowthStage,
} from '@gacp-erp/shared-schemas';
import { type PlantsRepository } from './plants.repository';
import { PlantAggregate } from './plant.aggregate';

@Injectable()
export class PlantsService {
  private readonly logger = new Logger(PlantsService.name);

  constructor(private readonly plantsRepo: PlantsRepository) {}

  async getById(id: string): Promise<Plant> {
    const plant = await this.plantsRepo.findById(id);
    if (!plant) {
      throw new NotFoundException(`Plant ${id} not found`);
    }
    return plant;
  }

  async getByBatch(
    batchId: string,
    pagination: PaginationQuery,
  ): Promise<PaginatedResponse<Plant>> {
    return this.plantsRepo.findManyByBatch(batchId, pagination);
  }

  async create(dto: CreatePlant, createdBy: string): Promise<Plant> {
    const existing = await this.plantsRepo.findByCode(dto.plant_code);
    if (existing) {
      throw new BadRequestException(`Plant code "${dto.plant_code}" already exists`);
    }
    const plant = await this.plantsRepo.create(dto, createdBy);
    this.logger.log(`Plant created: ${plant.id} (code: ${plant.plant_code})`);
    return plant;
  }

  async transitionStage(
    plantId: string,
    toStage: GrowthStage,
    transitionedBy: string,
    notes?: string,
    signature?: ElectronicSignature,
  ): Promise<PlantStageTransitionRecord> {
    const plant = await this.getById(plantId);
    const history = await this.plantsRepo.getStageHistory(plantId);

    const aggregate = new PlantAggregate(plant, history);
    const result = aggregate.transition(toStage, transitionedBy, notes, signature);

    if (!result.success) {
      const e = result.error;
      switch (e.code) {
        case 'INVALID_TRANSITION':
          throw new BadRequestException(`Cannot transition from ${e.from} to ${e.to}`);
        case 'SIGNATURE_REQUIRED':
          throw new BadRequestException(
            `Electronic signature required for transition to ${e.stage} (21 CFR §11.50)`,
          );
        case 'PLANT_DESTROYED':
        case 'PLANT_HARVESTED':
          throw new BadRequestException(`Plant is in terminal state: ${plant.current_stage}`);
      }
    }

    const stageRecord = result.data;

    await this.plantsRepo.updateStage(plantId, toStage, transitionedBy, {
      plant_id: plantId,
      from_stage: stageRecord.from_stage,
      to_stage: toStage,
      transitioned_by: transitionedBy,
      transitioned_at: new Date(),
      notes: notes ?? null,
      electronic_signature: (signature as unknown as Record<string, unknown>) ?? null,
    });

    this.logger.log(
      `Plant ${plantId} transitioned: ${stageRecord.from_stage} → ${toStage} by ${transitionedBy}`,
    );

    return stageRecord;
  }

  async getStageHistory(plantId: string): Promise<PlantStageTransitionRecord[]> {
    await this.getById(plantId); // ensures plant exists
    return this.plantsRepo.getStageHistory(plantId);
  }
}
