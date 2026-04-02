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
  NotFoundException,
} from '@nestjs/common';
import { z } from 'zod';
import {
  CreateDeviationSchema,
  InvestigateDeviationSchema,
  AssessDeviationImpactSchema,
  CloseDeviationSchema,
  DeviationStatusEnum,
  DeviationClassificationEnum,
  PaginationQuerySchema,
  type CreateDeviation,
  type InvestigateDeviation,
  type AssessDeviationImpact,
  type CloseDeviation,
} from '@gacp-erp/shared-schemas';
import { ZodBody } from '../common/decorators/zod-body.decorator';
import { DeviationRepository } from './deviation.repository';
import type { DeviationFilters } from './deviation.repository';
import { DeviationWorkflowUseCase } from './use-cases/deviation-workflow.use-case';
import { CapaRepository } from '../capa/capa.repository';

const LinkCapaBodySchema = z.object({ capa_id: z.string().uuid() });

const ListQuerySchema = PaginationQuerySchema.extend({
  status: DeviationStatusEnum.optional(),
  classification: DeviationClassificationEnum.optional(),
  search: z.string().optional(),
});

@Controller({ path: 'deviations', version: '1' })
export class DeviationController {
  constructor(
    private readonly repo: DeviationRepository,
    private readonly capaRepo: CapaRepository,
    private readonly workflowUseCase: DeviationWorkflowUseCase,
  ) {}

  @Get()
  list(@Query() rawQuery: unknown) {
    const { status, classification, search, ...pagination } = ListQuerySchema.parse(rawQuery);
    const filters: DeviationFilters = {};
    if (status !== undefined) filters.status = status;
    if (classification !== undefined) filters.classification = classification;
    if (search !== undefined) filters.search = search;
    return this.repo.findMany(filters, pagination);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.repo.findByIdOrThrow(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  report(
    @ZodBody(CreateDeviationSchema) dto: CreateDeviation,
    @Headers('x-user-id') userId: string,
  ) {
    return this.workflowUseCase.report(dto, userId ?? 'system');
  }

  @Post(':id/investigate')
  @HttpCode(HttpStatus.CREATED)
  investigate(
    @Param('id') id: string,
    @ZodBody(InvestigateDeviationSchema) dto: InvestigateDeviation,
    @Headers('x-user-id') userId: string,
  ) {
    return this.workflowUseCase.investigate(id, dto, userId ?? 'system');
  }

  @Patch(':id/assess-impact')
  assessImpact(
    @Param('id') id: string,
    @ZodBody(AssessDeviationImpactSchema) dto: AssessDeviationImpact,
    @Headers('x-user-id') userId: string,
  ) {
    return this.workflowUseCase.assessImpact(id, dto, userId ?? 'system');
  }

  @Patch(':id/link-capa')
  async linkCapa(
    @Param('id') id: string,
    @ZodBody(LinkCapaBodySchema) dto: { capa_id: string },
    @Headers('x-user-id') userId: string,
  ) {
    const capa = await this.capaRepo.findById(dto.capa_id);
    if (!capa) throw new NotFoundException(`CAPA ${dto.capa_id} not found`);
    return this.workflowUseCase.linkCapa(id, dto.capa_id, capa.capa_number, userId ?? 'system');
  }

  @Patch(':id/close')
  close(
    @Param('id') id: string,
    @ZodBody(CloseDeviationSchema) dto: CloseDeviation,
    @Headers('x-user-id') userId: string,
  ) {
    return this.workflowUseCase.close(id, dto, userId ?? 'system');
  }
}
