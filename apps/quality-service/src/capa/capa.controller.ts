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
  CreateCAPASchema,
  InitiateRcaSchema,
  CreateActionPlanSchema,
  RecordEffectivenessCheckSchema,
  CloseCapaSchema,
  CapaStatusEnum,
  CapaTypeEnum,
  PaginationQuerySchema,
  type CreateCAPA,
  type InitiateRca,
  type CreateActionPlan,
  type RecordEffectivenessCheck,
  type CloseCapaDto,
} from '@gacp-erp/shared-schemas';
import { ZodBody } from '../common/decorators/zod-body.decorator';
import type { CapaRepository, CapaFilters } from './capa.repository';
import { type CapaWorkflowUseCase } from './use-cases/capa-workflow.use-case';

const ListQuerySchema = PaginationQuerySchema.extend({
  status: CapaStatusEnum.optional(),
  type: CapaTypeEnum.optional(),
  search: z.string().optional(),
});

@Controller({ path: 'capas', version: '1' })
export class CapaController {
  constructor(
    private readonly repo: CapaRepository,
    private readonly workflowUseCase: CapaWorkflowUseCase,
  ) {}

  @Get()
  list(@Query() rawQuery: unknown) {
    const { status, type, search, ...pagination } = ListQuerySchema.parse(rawQuery);
    const filters: CapaFilters = {};
    if (status !== undefined) filters.status = status;
    if (type !== undefined) filters.type = type;
    if (search !== undefined) filters.search = search;
    return this.repo.findMany(filters, pagination);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.repo.findByIdOrThrow(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@ZodBody(CreateCAPASchema) dto: CreateCAPA, @Headers('x-user-id') userId: string) {
    return this.workflowUseCase.create(dto, userId ?? 'system');
  }

  @Post(':id/rca')
  @HttpCode(HttpStatus.CREATED)
  initiateRca(
    @Param('id') id: string,
    @ZodBody(InitiateRcaSchema) dto: InitiateRca,
    @Headers('x-user-id') userId: string,
  ) {
    return this.workflowUseCase.initiateRca(id, dto, userId ?? 'system');
  }

  @Post(':id/action-plan')
  @HttpCode(HttpStatus.CREATED)
  createActionPlan(
    @Param('id') id: string,
    @ZodBody(CreateActionPlanSchema) dto: CreateActionPlan,
    @Headers('x-user-id') userId: string,
  ) {
    return this.workflowUseCase.createActionPlan(id, dto, userId ?? 'system');
  }

  @Patch(':id/implement')
  implement(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    return this.workflowUseCase.implement(id, userId ?? 'system');
  }

  @Post(':id/effectiveness-check')
  @HttpCode(HttpStatus.CREATED)
  checkEffectiveness(
    @Param('id') id: string,
    @ZodBody(RecordEffectivenessCheckSchema) dto: RecordEffectivenessCheck,
    @Headers('x-user-id') userId: string,
  ) {
    return this.workflowUseCase.checkEffectiveness(id, dto, userId ?? 'system');
  }

  @Patch(':id/close')
  close(
    @Param('id') id: string,
    @ZodBody(CloseCapaSchema) dto: CloseCapaDto,
    @Headers('x-user-id') userId: string,
  ) {
    return this.workflowUseCase.close(id, dto, userId ?? 'system');
  }
}
