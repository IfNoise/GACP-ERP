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
  CreateRackSchema,
  CreateTraySchema,
  type CreateFacilityZone,
  type AssignBatchToZone,
  type ReleaseBatchFromZone,
  type CreateRack,
  type CreateTray,
} from '@gacp-erp/shared-schemas';
import { ZodBody } from '../common/decorators/zod-body.decorator';
import { SpatialRepository } from './spatial.repository';
import type { ZoneFilters } from './spatial.repository';
import { SpatialPlanningUseCase } from './use-cases/spatial-planning.use-case';
import { CreateRackUseCase } from './use-cases/create-rack.use-case';
import { DeleteRackUseCase } from './use-cases/delete-rack.use-case';
import { CreateTrayUseCase } from './use-cases/create-tray.use-case';
import { DeleteTrayUseCase } from './use-cases/delete-tray.use-case';

const ZoneListQuerySchema = PaginationQuerySchema.extend({
  limit: z.coerce.number().int().min(1).max(1000).default(20),
  zone_type: ZoneTypeEnum.optional(),
  is_active: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  top_level_only: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
});

@Controller({ path: 'spatial', version: '1' })
export class SpatialController {
  constructor(
    private readonly repo: SpatialRepository,
    private readonly planningUseCase: SpatialPlanningUseCase,
    private readonly createRackUseCase: CreateRackUseCase,
    private readonly deleteRackUseCase: DeleteRackUseCase,
    private readonly createTrayUseCase: CreateTrayUseCase,
    private readonly deleteTrayUseCase: DeleteTrayUseCase,
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
    const { zone_type, is_active, top_level_only, ...pagination } =
      ZoneListQuerySchema.parse(rawQuery);
    const filters: ZoneFilters = {};
    if (zone_type !== undefined) filters.zone_type = zone_type;
    if (is_active !== undefined) filters.is_active = is_active;

    if (top_level_only) {
      return this.repo.findTopLevelZones(filters, pagination);
    }
    return this.repo.findManyZones(filters, pagination);
  }

  @Get('zones/:id')
  getZone(@Param('id') id: string) {
    return this.repo.findZoneByIdOrThrow(id);
  }

  @Get('zones/:id/hierarchy')
  async getZoneHierarchy(@Param('id') id: string) {
    return this.repo.findZoneHierarchy(id);
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

  // ── Racks ────────────────────────────────────────────────────────────────────

  @Post('racks')
  @HttpCode(HttpStatus.CREATED)
  createRack(@ZodBody(CreateRackSchema) dto: CreateRack, @Headers('x-user-id') userId: string) {
    return this.createRackUseCase.execute(dto, userId ?? 'system');
  }

  @Get('zones/:zoneId/racks')
  listZoneRacks(@Param('zoneId') zoneId: string, @Query() rawQuery: unknown) {
    const pagination = PaginationQuerySchema.parse(rawQuery);
    return this.repo.findRacksByZonePaginated(zoneId, pagination);
  }

  @Get('racks/:id')
  getRack(@Param('id') id: string) {
    return this.repo.findRackByIdOrThrow(id);
  }

  @Delete('racks/:id')
  deleteRack(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    return this.deleteRackUseCase.execute(id, userId ?? 'system');
  }

  // ── Trays ────────────────────────────────────────────────────────────────────

  @Post('racks/:rackId/trays')
  @HttpCode(HttpStatus.CREATED)
  createTray(
    @Param('rackId') rackId: string,
    @ZodBody(CreateTraySchema) dto: CreateTray,
    @Headers('x-user-id') userId: string,
  ) {
    return this.createTrayUseCase.execute({ ...dto, rack_id: rackId }, userId ?? 'system');
  }

  @Get('racks/:rackId/trays')
  listRackTrays(@Param('rackId') rackId: string, @Query() rawQuery: unknown) {
    const pagination = PaginationQuerySchema.parse(rawQuery);
    return this.repo.listTraysByRack(rackId, pagination);
  }

  @Delete('trays/:id')
  deleteTray(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    return this.deleteTrayUseCase.execute(id, userId ?? 'system');
  }
}
