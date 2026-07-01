import { Module } from '@nestjs/common';
import { OutboxModule } from '../outbox/outbox.module';
import { IfcRevisionRepository } from './ifc-revision.repository';
import { IfcController } from './ifc.controller';
import { IfcProjectionConsumer } from './ifc-projection.consumer';
import { UploadIfcRevisionUseCase } from './use-cases/upload-ifc-revision.use-case';
import { RequestIfcApprovalUseCase } from './use-cases/request-ifc-approval.use-case';
import { ApproveIfcRevisionUseCase } from './use-cases/approve-ifc-revision.use-case';
import { RejectIfcRevisionUseCase } from './use-cases/reject-ifc-revision.use-case';

@Module({
  imports: [OutboxModule],
  controllers: [IfcController, IfcProjectionConsumer],
  providers: [
    IfcRevisionRepository,
    UploadIfcRevisionUseCase,
    RequestIfcApprovalUseCase,
    ApproveIfcRevisionUseCase,
    RejectIfcRevisionUseCase,
  ],
})
export class IfcModule {}
