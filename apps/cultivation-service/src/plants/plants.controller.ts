import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { z } from 'zod';
import {
  CreatePlantSchema,
  UpdatePlantSchema,
  StageTransitionSchema,
  PaginationQuerySchema,
  GrowthStageEnum,
  type CreatePlant,
  type UpdatePlant,
  type StageTransition,
} from '@gacp-erp/shared-schemas';
import { PlantsService } from './plants.service';
import { QrService } from '../qr/qr.service';
import { ZodBody } from '../common/decorators/zod-body.decorator';

const ListPlantsQuerySchema = PaginationQuerySchema.extend({
  batch_id: z.string().uuid().optional(),
  zone_id: z.string().uuid().optional(),
  stage: GrowthStageEnum.optional(),
});

@Controller({ path: 'plants', version: '1' })
export class PlantsController {
  constructor(
    private readonly plantsService: PlantsService,
    private readonly qrService: QrService,
  ) {}

  /** GET /api/v1/plants */
  @Get()
  list(@Query() rawQuery: unknown) {
    const { batch_id, zone_id, stage, ...pagination } = ListPlantsQuerySchema.parse(rawQuery);
    const filters = {
      ...(batch_id !== undefined && { batch_id }),
      ...(zone_id !== undefined && { zone_id }),
      ...(stage !== undefined && { stage }),
    };
    return this.plantsService.list(filters, pagination);
  }

  /** GET /api/v1/plants/:id */
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.plantsService.getById(id);
  }

  /** GET /api/v1/plants/:id/stages */
  @Get(':id/stages')
  stageHistory(@Param('id') id: string) {
    return this.plantsService.getStageHistory(id);
  }

  /** GET /api/v1/plants/:id/qr */
  @Get(':id/qr')
  async getQr(@Param('id') id: string) {
    const plant = await this.plantsService.getById(id);
    return this.qrService.generatePlantQr(plant.id, plant.plant_code, plant.facility_id);
  }

  /** POST /api/v1/plants */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@ZodBody(CreatePlantSchema) dto: CreatePlant, @Headers('x-user-id') userId: string) {
    return this.plantsService.create(dto, userId ?? 'system');
  }

  /** POST /api/v1/plants/:id/transition */
  @Post(':id/transition')
  transitionStage(
    @Param('id') id: string,
    @ZodBody(StageTransitionSchema) dto: StageTransition,
    @Headers('x-user-id') userId: string,
  ) {
    return this.plantsService.transitionStage(
      id,
      dto.target_stage,
      userId ?? 'system',
      dto.notes,
      dto.electronic_signature,
    );
  }

  /** PATCH /api/v1/plants/:id */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @ZodBody(UpdatePlantSchema) dto: UpdatePlant,
    @Headers('x-user-id') userId: string,
  ) {
    return this.plantsService.update(id, dto, userId ?? 'system');
  }

  /** DELETE /api/v1/plants/:id */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    return this.plantsService.softDelete(id, userId ?? 'system');
  }
}
