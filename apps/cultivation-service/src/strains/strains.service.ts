import { Injectable, NotFoundException } from '@nestjs/common';
import {
  type Strain,
  type CreateStrain,
  type UpdateStrain,
  type DeactivateStrain,
  type PaginationQuery,
  type PaginatedResponse,
} from '@gacp-erp/shared-schemas';
import { StrainsRepository } from './strains.repository';
import { CreateStrainUseCase } from './use-cases/create-strain.use-case';
import { UpdateStrainUseCase } from './use-cases/update-strain.use-case';
import { DeactivateStrainUseCase } from './use-cases/deactivate-strain.use-case';

@Injectable()
export class StrainsService {
  constructor(
    private readonly strainsRepo: StrainsRepository,
    private readonly createStrainUseCase: CreateStrainUseCase,
    private readonly updateStrainUseCase: UpdateStrainUseCase,
    private readonly deactivateStrainUseCase: DeactivateStrainUseCase,
  ) {}

  async getById(id: string): Promise<Strain> {
    const strain = await this.strainsRepo.findById(id);
    if (!strain) {
      throw new NotFoundException(`Strain ${id} not found`);
    }
    return strain;
  }

  async list(
    filters: { species?: string; supplier_id?: string; is_active?: boolean },
    pagination: PaginationQuery,
  ): Promise<PaginatedResponse<Strain>> {
    return this.strainsRepo.findMany(filters, pagination);
  }

  async create(dto: CreateStrain, createdBy: string): Promise<Strain> {
    return this.createStrainUseCase.execute(dto, createdBy);
  }

  async update(id: string, dto: UpdateStrain, updatedBy: string): Promise<Strain> {
    return this.updateStrainUseCase.execute(id, dto, updatedBy);
  }

  async deactivate(id: string, dto: DeactivateStrain, deactivatedBy: string): Promise<Strain> {
    return this.deactivateStrainUseCase.execute(id, dto, deactivatedBy);
  }
}
