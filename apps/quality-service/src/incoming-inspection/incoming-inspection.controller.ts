import { Controller, Get, Post, Param, Query, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { z } from 'zod';
import {
  PerformInspectionSchema,
  RecordTestResultsSchema,
  ReleaseInspectionSchema,
  RejectInspectionSchema,
  IncomingInspectionStatusEnum,
  PaginationQuerySchema,
  type PerformInspection,
  type RecordTestResults,
  type ReleaseInspection,
  type RejectInspection,
} from '@gacp-erp/shared-schemas';
import { ZodBody } from '../common/decorators/zod-body.decorator';
import { IncomingInspectionRepository } from './incoming-inspection.repository';
import type { InspectionFilters } from './incoming-inspection.repository';
import { IncomingInspectionWorkflowUseCase } from './use-cases/incoming-inspection-workflow.use-case';

const InspectionListQuerySchema = PaginationQuerySchema.extend({
  status: IncomingInspectionStatusEnum.optional(),
  supplier_id: z.string().uuid().optional(),
  strain_id: z.string().uuid().optional(),
  po_id: z.string().uuid().optional(),
});

@Controller({ path: 'incoming-inspections', version: '1' })
export class IncomingInspectionController {
  constructor(
    private readonly repo: IncomingInspectionRepository,
    private readonly workflowUseCase: IncomingInspectionWorkflowUseCase,
  ) {}

  @Get()
  listInspections(@Query() rawQuery: unknown) {
    const { status, supplier_id, strain_id, po_id, ...pagination } =
      InspectionListQuerySchema.parse(rawQuery);
    const filters: InspectionFilters = {};
    if (status !== undefined) filters.status = status;
    if (supplier_id !== undefined) filters.supplier_id = supplier_id;
    if (strain_id !== undefined) filters.strain_id = strain_id;
    if (po_id !== undefined) filters.po_id = po_id;
    return this.repo.findMany(filters, pagination);
  }

  @Get(':id')
  getInspection(@Param('id') id: string) {
    return this.repo.findByIdOrThrow(id);
  }

  /** PENDING → IN_PROGRESS: Visual + quantity check */
  @Post(':id/perform')
  @HttpCode(HttpStatus.OK)
  performInspection(
    @Param('id') id: string,
    @ZodBody(PerformInspectionSchema) dto: PerformInspection,
    @Headers('x-user-id') userId: string,
  ) {
    return this.workflowUseCase.performInspection(id, dto, userId ?? 'system');
  }

  /** IN_PROGRESS → QUARANTINE: Lab test results */
  @Post(':id/test-results')
  @HttpCode(HttpStatus.OK)
  recordTestResults(
    @Param('id') id: string,
    @ZodBody(RecordTestResultsSchema) dto: RecordTestResults,
    @Headers('x-user-id') userId: string,
  ) {
    return this.workflowUseCase.recordTestResults(id, dto, userId ?? 'system');
  }

  /** QUARANTINE → RELEASED: Release with all criteria met */
  @Post(':id/release')
  @HttpCode(HttpStatus.OK)
  releaseInspection(
    @Param('id') id: string,
    @ZodBody(ReleaseInspectionSchema) dto: ReleaseInspection,
    @Headers('x-user-id') userId: string,
  ) {
    return this.workflowUseCase.release(id, dto, userId ?? 'system');
  }

  /** IN_PROGRESS | QUARANTINE → REJECTED */
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  rejectInspection(
    @Param('id') id: string,
    @ZodBody(RejectInspectionSchema) dto: RejectInspection,
    @Headers('x-user-id') userId: string,
  ) {
    return this.workflowUseCase.reject(id, dto, userId ?? 'system');
  }
}
