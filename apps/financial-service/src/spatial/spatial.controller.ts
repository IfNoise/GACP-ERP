import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { z } from 'zod';
import {
  CreateFacilityZoneSchema,
  AssignBatchToZoneSchema,
  ReleaseBatchFromZoneSchema,
  ZoneTypeEnum,
  PaginationQuerySchema,
  type CreateFacilityZone,
  type AssignBatchToZone,
  type ReleaseBatchFromZone,
} from '@gacp-erp/shared-schemas';
import { ZodBody } from '../common/decorators/zod-body.decorator';
import type { SpatialRepository, ZoneFilters } from './spatial.repository';
import { type SpatialPlanningUseCase } from './use-cases/spatial-planning.use-case';

const ZoneListQuerySchema = PaginationQuerySchema.extend({
  zone_type: ZoneTypeEnum.optional(),
  is_active: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
});

@Controller({ path: 'spatial', version: '1' })
export class SpatialController {
  constructor(
    private readonly repo: SpatialRepository,
    private readonly planningUseCase: SpatialPlanningUseCase,
  ) {}

  @Post('zones')
  @HttpCode(HttpStatus.CREATED)
  createZone(
    @ZodBody(CreateFacilityZoneSchema) dto: CreateFacilityZone,
    @Headers('x-user-id') userId: string,
  ) {
    return this.planningUseCase.createZone(dto, userId ?? 'system');
  }

  @Get('zones')
  listZones(@Query() rawQuery: unknown) {
    const { zone_type, is_active, ...pagination } = ZoneListQuerySchema.parse(rawQuery);
    const filters: ZoneFilters = {};
    if (zone_type !== undefined) filters.zone_type = zone_type;
    if (is_active !== undefined) filters.is_active = is_active;
    return this.repo.findManyZones(filters, pagination);
  }

  @Get('zones/:id')
  getZone(@Param('id') id: string) {
    return this.repo.findZoneByIdOrThrow(id);
  }

  @Post('zones/assignments')
  @HttpCode(HttpStatus.CREATED)
  assignBatch(
    @ZodBody(AssignBatchToZoneSchema) dto: AssignBatchToZone,
    @Headers('x-user-id') userId: string,
  ) {
    return this.planningUseCase.assignBatchToZone(dto, userId ?? 'system');
  }

  @Get('zones/assignments/:id')
  getAssignment(@Param('id') id: string) {
    return this.repo.findAssignmentByIdOrThrow(id);
  }

  @Delete('zones/assignments/:id')
  releaseBatch(
    @Param('id') id: string,
    @ZodBody(ReleaseBatchFromZoneSchema) dto: ReleaseBatchFromZone,
    @Headers('x-user-id') userId: string,
  ) {
    return this.planningUseCase.releaseBatchFromZone(
      { ...dto, assignment_id: id },
      userId ?? 'system',
    );
  }

  @Get('zones/:zoneId/assignments')
  listActiveAssignments(@Param('zoneId') zoneId: string, @Query() rawQuery: unknown) {
    const pagination = PaginationQuerySchema.parse(rawQuery);
    return this.repo.listActiveAssignmentsForZone(zoneId, pagination);
  }
}
