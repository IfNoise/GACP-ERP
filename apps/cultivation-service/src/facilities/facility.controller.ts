import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { z } from 'zod';
import {
  CreateBuildingSchema,
  CreateFacilitySchema,
  UpdateFacilitySchema,
  PaginationQuerySchema,
  PlantZoneTypeEnum,
  BuildingTypeEnum,
  type CreateFacility,
  type UpdateFacility,
} from '@gacp-erp/shared-schemas';
import { FacilityRepository } from './facility.repository';
import { BuildingRepository } from './building.repository';
import { ZoneRepository } from './zone.repository';
import { CreateFacilityUseCase } from './use-cases/create-facility.use-case';
import { CreateBuildingUseCase } from './use-cases/create-building.use-case';
import { ZodBody } from '../common/decorators/zod-body.decorator';

const ListFacilitiesQuerySchema = PaginationQuerySchema.extend({
  is_active: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
});

const ListBuildingsQuerySchema = PaginationQuerySchema.extend({
  building_type: BuildingTypeEnum.optional(),
});

const ListZonesQuerySchema = PaginationQuerySchema.extend({
  zone_type: PlantZoneTypeEnum.optional(),
});

@Controller({ path: 'facilities', version: '1' })
export class FacilityController {
  constructor(
    private readonly facilityRepo: FacilityRepository,
    private readonly buildingRepo: BuildingRepository,
    private readonly zoneRepo: ZoneRepository,
    private readonly createFacilityUseCase: CreateFacilityUseCase,
    private readonly createBuildingUseCase: CreateBuildingUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@ZodBody(CreateFacilitySchema) dto: CreateFacility, @Headers('x-user-id') userId: string) {
    return this.createFacilityUseCase.execute(dto, userId ?? 'system');
  }

  @Get()
  list(@Query() rawQuery: unknown) {
    const { is_active, ...pagination } = ListFacilitiesQuerySchema.parse(rawQuery);
    return this.facilityRepo.findMany(is_active !== undefined ? { is_active } : {}, pagination);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.facilityRepo.findByIdOrThrow(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @ZodBody(UpdateFacilitySchema) dto: UpdateFacility,
    @Headers('x-user-id') userId: string,
  ) {
    return this.facilityRepo.update(id, dto, userId ?? 'system');
  }

  @Get(':facilityId/buildings')
  listBuildings(@Param('facilityId') facilityId: string, @Query() rawQuery: unknown) {
    const { building_type, ...pagination } = ListBuildingsQuerySchema.parse(rawQuery);
    return this.buildingRepo.findManyByFacility(
      facilityId,
      building_type !== undefined ? { building_type } : {},
      pagination,
    );
  }

  @Post(':facilityId/buildings')
  @HttpCode(HttpStatus.CREATED)
  createBuilding(
    @Param('facilityId') facilityId: string,
    @ZodBody(CreateBuildingSchema.omit({ facility_id: true }))
    dto: Omit<z.infer<typeof CreateBuildingSchema>, 'facility_id'>,
    @Headers('x-user-id') userId: string,
  ) {
    return this.createBuildingUseCase.execute(
      { ...dto, facility_id: facilityId } as z.infer<typeof CreateBuildingSchema>,
      userId ?? 'system',
    );
  }

  @Get(':facilityId/zones')
  listZonesByFacility(@Param('facilityId') facilityId: string, @Query() rawQuery: unknown) {
    const { zone_type, ...pagination } = ListZonesQuerySchema.parse(rawQuery);
    return this.zoneRepo.findManyByFacility(
      facilityId,
      zone_type !== undefined ? { zone_type } : {},
      pagination,
    );
  }
}
