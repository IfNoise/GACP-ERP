import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import {
  type Plant,
  type CreatePlant,
  type UpdatePlant,
  type MovePlant,
  type PlantStageTransitionRecord,
  type ElectronicSignature,
  type PaginationQuery,
  type PaginatedResponse,
  type GrowthStage,
} from '@gacp-erp/shared-schemas';
import { PlantsRepository } from './plants.repository';
import { CreatePlantUseCase } from './use-cases/create-plant.use-case';
import { TransitionStageUseCase } from './use-cases/transition-stage.use-case';
import { MovePlantUseCase } from './use-cases/move-plant.use-case';

@Injectable()
export class PlantsService {
  private readonly logger = new Logger(PlantsService.name);

  constructor(
    private readonly plantsRepo: PlantsRepository,
    private readonly createPlantUseCase: CreatePlantUseCase,
    private readonly transitionStageUseCase: TransitionStageUseCase,
    private readonly movePlantUseCase: MovePlantUseCase,
  ) {}

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
    return this.createPlantUseCase.execute(dto, createdBy);
  }

  async transitionStage(
    plantId: string,
    toStage: GrowthStage,
    transitionedBy: string,
    notes?: string,
    signature?: ElectronicSignature,
  ): Promise<PlantStageTransitionRecord> {
    return this.transitionStageUseCase.execute(plantId, toStage, transitionedBy, notes, signature);
  }

  async getStageHistory(plantId: string): Promise<PlantStageTransitionRecord[]> {
    await this.getById(plantId); // ensures plant exists
    return this.plantsRepo.getStageHistory(plantId);
  }

  async list(
    filters: { batch_id?: string; zone_id?: string; stage?: GrowthStage },
    pagination: PaginationQuery,
  ): Promise<PaginatedResponse<Plant>> {
    return this.plantsRepo.findMany(filters, pagination);
  }

  async update(id: string, dto: UpdatePlant, updatedBy: string): Promise<Plant> {
    await this.getById(id); // throws NotFoundException if not found
    const plant = await this.plantsRepo.update(id, dto, updatedBy);
    if (!plant) throw new NotFoundException(`Plant ${id} not found`);
    return plant;
  }

  async movePlant(plantId: string, dto: MovePlant, movedBy: string): Promise<Plant> {
    return this.movePlantUseCase.execute(plantId, dto, movedBy);
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    await this.getById(id); // throws NotFoundException if not found
    await this.plantsRepo.softDelete(id, deletedBy);
    this.logger.log(`Plant ${id} soft-deleted by ${deletedBy}`);
  }
}
