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
import {
  CreateQualityEventSchema,
  InvestigateQualityEventSchema,
  LinkRecordToEventSchema,
  CloseQualityEventSchema,
  QualityEventTypeEnum,
  QualityEventSeverityEnum,
  QualityEventStatusEnum,
  PaginationQuerySchema,
  type CreateQualityEvent,
  type InvestigateQualityEvent,
  type LinkRecordToEvent,
  type CloseQualityEvent,
} from '@gacp-erp/shared-schemas';
import { ZodBody } from '../common/decorators/zod-body.decorator';
import { QualityEventRepository } from './quality-event.repository';
import type { QualityEventFilters } from './quality-event.repository';
import { QualityEventWorkflowUseCase } from './use-cases/quality-event-workflow.use-case';

const ListQuerySchema = PaginationQuerySchema.extend({
  status: QualityEventStatusEnum.optional(),
  type: QualityEventTypeEnum.optional(),
  severity: QualityEventSeverityEnum.optional(),
});

@Controller({ path: 'quality-events', version: '1' })
export class QualityEventController {
  constructor(
    private readonly repo: QualityEventRepository,
    private readonly workflowUseCase: QualityEventWorkflowUseCase,
  ) {}

  @Get()
  list(@Query() rawQuery: unknown) {
    const { status, type, severity, ...pagination } = ListQuerySchema.parse(rawQuery);
    const filters: QualityEventFilters = {};
    if (status !== undefined) filters.status = status;
    if (type !== undefined) filters.type = type;
    if (severity !== undefined) filters.severity = severity;
    return this.repo.findMany(filters, pagination);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.repo.findByIdOrThrow(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @ZodBody(CreateQualityEventSchema) dto: CreateQualityEvent,
    @Headers('x-user-id') userId: string,
  ) {
    return this.workflowUseCase.create(dto, userId ?? 'system');
  }

  @Patch(':id/investigate')
  investigate(
    @Param('id') id: string,
    @ZodBody(InvestigateQualityEventSchema) dto: InvestigateQualityEvent,
    @Headers('x-user-id') userId: string,
  ) {
    return this.workflowUseCase.investigate(id, dto, userId ?? 'system');
  }

  @Post(':id/link-record')
  @HttpCode(HttpStatus.CREATED)
  linkRecord(
    @Param('id') id: string,
    @ZodBody(LinkRecordToEventSchema) dto: LinkRecordToEvent,
    @Headers('x-user-id') userId: string,
  ) {
    return this.workflowUseCase.linkRecord(id, dto, userId ?? 'system');
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  close(
    @Param('id') id: string,
    @ZodBody(CloseQualityEventSchema) dto: CloseQualityEvent,
    @Headers('x-user-id') userId: string,
  ) {
    return this.workflowUseCase.close(id, dto, userId ?? 'system');
  }
}
