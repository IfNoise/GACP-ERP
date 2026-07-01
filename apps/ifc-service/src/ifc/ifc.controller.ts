import {
  Controller,
  Get,
  Post,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Query,
  Headers,
  NotFoundException,
} from '@nestjs/common';
import {
  IfcApproveRevisionBodySchema,
  IfcListRevisionsQuerySchema,
  IfcRejectRevisionBodySchema,
  IfcRequestApprovalBodySchema,
  IfcUploadRevisionBodySchema,
  type IfcApproveRevisionBody,
  type IfcListRevisionsQuery,
  type IfcRejectRevisionBody,
  type IfcRequestApprovalBody,
  type IfcUploadRevisionBody,
} from '@gacp-erp/shared-schemas';
import { ZodBody } from '../common/decorators/zod-body.decorator';
import { IfcRevisionRepository } from './ifc-revision.repository';
import { UploadIfcRevisionUseCase } from './use-cases/upload-ifc-revision.use-case';
import { RequestIfcApprovalUseCase } from './use-cases/request-ifc-approval.use-case';
import { ApproveIfcRevisionUseCase } from './use-cases/approve-ifc-revision.use-case';
import { RejectIfcRevisionUseCase } from './use-cases/reject-ifc-revision.use-case';

@Controller({ path: 'ifc', version: '1' })
export class IfcController {
  constructor(
    private readonly revisionRepo: IfcRevisionRepository,
    private readonly uploadUseCase: UploadIfcRevisionUseCase,
    private readonly requestApprovalUseCase: RequestIfcApprovalUseCase,
    private readonly approveUseCase: ApproveIfcRevisionUseCase,
    private readonly rejectUseCase: RejectIfcRevisionUseCase,
  ) {}

  @Post('revisions')
  @HttpCode(HttpStatus.CREATED)
  uploadRevision(
    @ZodBody(IfcUploadRevisionBodySchema) body: IfcUploadRevisionBody,
    @Headers('x-user-id') userId: string,
  ) {
    return this.uploadUseCase.execute(body, userId);
  }

  @Get('revisions')
  listRevisions(@Query() rawQuery: unknown) {
    const query = IfcListRevisionsQuerySchema.parse(rawQuery) as IfcListRevisionsQuery;
    return this.revisionRepo.findMany(query);
  }

  @Get('revisions/:revisionId')
  async getRevision(@Param('revisionId', ParseUUIDPipe) revisionId: string) {
    const revision = await this.revisionRepo.findById(revisionId);
    if (!revision) {
      throw new NotFoundException(`IFC revision ${revisionId} not found`);
    }
    return revision;
  }

  @Post('revisions/:revisionId/approval-request')
  requestApproval(
    @Param('revisionId', ParseUUIDPipe) revisionId: string,
    @ZodBody(IfcRequestApprovalBodySchema) body: IfcRequestApprovalBody,
    @Headers('x-user-id') userId: string,
  ) {
    return this.requestApprovalUseCase.execute(revisionId, body, userId);
  }

  @Post('revisions/:revisionId/approve')
  approveRevision(
    @Param('revisionId', ParseUUIDPipe) revisionId: string,
    @ZodBody(IfcApproveRevisionBodySchema) body: IfcApproveRevisionBody,
    @Headers('x-user-id') userId: string,
  ) {
    return this.approveUseCase.execute(revisionId, body, userId);
  }

  @Post('revisions/:revisionId/reject')
  rejectRevision(
    @Param('revisionId', ParseUUIDPipe) revisionId: string,
    @ZodBody(IfcRejectRevisionBodySchema) body: IfcRejectRevisionBody,
    @Headers('x-user-id') userId: string,
  ) {
    return this.rejectUseCase.execute(revisionId, body, userId);
  }
}
