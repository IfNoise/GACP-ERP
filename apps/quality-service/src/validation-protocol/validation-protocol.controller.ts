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
  CreateValidationProtocolSchema,
  ApproveValidationProtocolSchema,
  ExecuteValidationTestSchema,
  CloseValidationProtocolSchema,
  ValidationProtocolTypeEnum,
  ValidationProtocolStatusEnum,
  PaginationQuerySchema,
  type CreateValidationProtocol,
  type ApproveValidationProtocol,
  type ExecuteValidationTest,
  type CloseValidationProtocol,
} from '@gacp-erp/shared-schemas';
import { ZodBody } from '../common/decorators/zod-body.decorator';
import { ValidationProtocolRepository } from './validation-protocol.repository';
import type { ValidationProtocolFilters } from './validation-protocol.repository';
import { CreateValidationProtocolUseCase } from './use-cases/create-validation-protocol.use-case';
import { ValidationProtocolWorkflowUseCase } from './use-cases/validation-protocol-workflow.use-case';

const ListQuerySchema = PaginationQuerySchema.extend({
  status: ValidationProtocolStatusEnum.optional(),
  type: ValidationProtocolTypeEnum.optional(),
  change_control_id: z.string().uuid().optional(),
});

@Controller({ path: 'validation-protocols', version: '1' })
export class ValidationProtocolController {
  constructor(
    private readonly repo: ValidationProtocolRepository,
    private readonly createUseCase: CreateValidationProtocolUseCase,
    private readonly workflowUseCase: ValidationProtocolWorkflowUseCase,
  ) {}

  @Get()
  list(@Query() rawQuery: unknown) {
    const { status, type, change_control_id, ...pagination } = ListQuerySchema.parse(rawQuery);
    const filters: ValidationProtocolFilters = {};
    if (status !== undefined) filters.status = status;
    if (type !== undefined) filters.type = type;
    if (change_control_id !== undefined) filters.change_control_id = change_control_id;
    return this.repo.findMany(filters, pagination);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.repo.findByIdOrThrow(id);
  }

  @Get(':id/summary')
  async getSummary(@Param('id') id: string) {
    const protocol = await this.repo.findByIdOrThrow(id);
    const steps = protocol.test_steps;
    const total = steps.length;
    const passed = steps.filter((s) => s.status === 'PASS').length;
    const failed = steps.filter((s) => s.status === 'FAIL').length;
    const notApplicable = steps.filter((s) => s.status === 'NOT_APPLICABLE').length;
    const pending = steps.filter((s) => s.status === 'PENDING').length;
    return {
      protocol,
      test_summary: {
        total,
        passed,
        failed,
        not_applicable: notApplicable,
        pending,
        pass_rate_pct: total > 0 ? Math.round((passed / total) * 100) : 0,
      },
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @ZodBody(CreateValidationProtocolSchema) dto: CreateValidationProtocol,
    @Headers('x-user-id') userId: string,
  ) {
    return this.createUseCase.execute(dto, userId ?? 'system');
  }

  @Patch(':id/submit-review')
  submitForReview(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    return this.workflowUseCase.submitForReview(id, userId ?? 'system');
  }

  @Patch(':id/return-draft')
  returnToDraft(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    return this.workflowUseCase.returnToDraft(id, userId ?? 'system');
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  approve(
    @Param('id') id: string,
    @ZodBody(ApproveValidationProtocolSchema) dto: ApproveValidationProtocol,
    @Headers('x-user-id') userId: string,
  ) {
    return this.workflowUseCase.approve(id, dto, userId ?? 'system');
  }

  @Patch(':id/start-execution')
  startExecution(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    return this.workflowUseCase.startExecution(id, userId ?? 'system');
  }

  @Post(':id/execute-test')
  @HttpCode(HttpStatus.OK)
  executeTest(
    @Param('id') id: string,
    @ZodBody(ExecuteValidationTestSchema) dto: ExecuteValidationTest,
    @Headers('x-user-id') userId: string,
  ) {
    return this.workflowUseCase.executeTest(id, dto, userId ?? 'system');
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    return this.workflowUseCase.complete(id, userId ?? 'system');
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  close(
    @Param('id') id: string,
    @ZodBody(CloseValidationProtocolSchema) dto: CloseValidationProtocol,
    @Headers('x-user-id') userId: string,
  ) {
    return this.workflowUseCase.close(id, dto, userId ?? 'system');
  }
}
