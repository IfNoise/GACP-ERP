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
  CreateChangeControlSchema,
  AssessImpactSchema,
  ApproveChangeControlSchema,
  RejectChangeControlSchema,
  VerifyChangeControlSchema,
  CloseChangeControlSchema,
  ChangeControlStatusEnum,
  PaginationQuerySchema,
  type CreateChangeControl,
  type AssessImpact,
  type ApproveChangeControl,
  type RejectChangeControl,
  type VerifyChangeControl,
  type CloseChangeControl,
} from '@gacp-erp/shared-schemas';
import { ZodBody } from '../common/decorators/zod-body.decorator';
import type { ChangeControlRepository, ChangeControlFilters } from './change-control.repository';
import { type CreateChangeControlUseCase } from './use-cases/create-change-control.use-case';
import { type ChangeControlWorkflowUseCase } from './use-cases/change-control-workflow.use-case';
import { type AssessImpactUseCase } from './use-cases/assess-impact.use-case';

const ListQuerySchema = PaginationQuerySchema.extend({
  status: ChangeControlStatusEnum.optional(),
  change_type: z.enum(['MINOR', 'MAJOR', 'EMERGENCY']).optional(),
  search: z.string().optional(),
});

@Controller({ path: 'change-controls', version: '1' })
export class ChangeControlController {
  constructor(
    private readonly repo: ChangeControlRepository,
    private readonly createUseCase: CreateChangeControlUseCase,
    private readonly workflowUseCase: ChangeControlWorkflowUseCase,
    private readonly assessImpactUseCase: AssessImpactUseCase,
  ) {}

  @Get()
  list(@Query() rawQuery: unknown) {
    const { status, change_type, search, ...pagination } = ListQuerySchema.parse(rawQuery);
    const filters: ChangeControlFilters = {};
    if (status !== undefined) filters.status = status;
    if (change_type !== undefined) filters.change_type = change_type;
    if (search !== undefined) filters.search = search;
    return this.repo.findMany(filters, pagination);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.repo.findByIdOrThrow(id);
  }

  @Get(':id/impacts')
  getImpacts(@Param('id') id: string) {
    return this.repo.findImpacts(id);
  }

  @Get(':id/approvals')
  getApprovals(@Param('id') id: string) {
    return this.repo.findApprovals(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @ZodBody(CreateChangeControlSchema) dto: CreateChangeControl,
    @Headers('x-user-id') userId: string,
  ) {
    return this.createUseCase.execute(dto, userId ?? 'system');
  }

  @Patch(':id/submit')
  submit(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    return this.workflowUseCase.submit(id, userId ?? 'system');
  }

  @Post(':id/impact-assessment')
  @HttpCode(HttpStatus.CREATED)
  assessImpact(
    @Param('id') id: string,
    @ZodBody(AssessImpactSchema) dto: AssessImpact,
    @Headers('x-user-id') userId: string,
  ) {
    return this.assessImpactUseCase.execute(id, dto, userId ?? 'system');
  }

  @Patch(':id/approve')
  approve(
    @Param('id') id: string,
    @ZodBody(ApproveChangeControlSchema) dto: ApproveChangeControl,
    @Headers('x-user-id') userId: string,
  ) {
    return this.workflowUseCase.approve(id, userId ?? 'system', 1, dto.electronic_signature);
  }

  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @ZodBody(RejectChangeControlSchema) dto: RejectChangeControl,
    @Headers('x-user-id') userId: string,
  ) {
    return this.workflowUseCase.reject(
      id,
      userId ?? 'system',
      dto.rejection_reason,
      dto.electronic_signature,
    );
  }

  @Patch(':id/implement')
  implement(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    return this.workflowUseCase.implement(id, userId ?? 'system');
  }

  @Patch(':id/verify')
  verify(
    @Param('id') id: string,
    @ZodBody(VerifyChangeControlSchema) dto: VerifyChangeControl,
    @Headers('x-user-id') userId: string,
  ) {
    return this.workflowUseCase.verify(
      id,
      userId ?? 'system',
      dto.verification_notes,
      dto.electronic_signature,
    );
  }

  @Patch(':id/close')
  close(
    @Param('id') id: string,
    @ZodBody(CloseChangeControlSchema) dto: CloseChangeControl,
    @Headers('x-user-id') userId: string,
  ) {
    return this.workflowUseCase.close(id, userId ?? 'system', dto.closure_summary);
  }
}
