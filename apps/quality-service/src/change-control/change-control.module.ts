import { Module } from '@nestjs/common';
import { ChangeControlRepository } from './change-control.repository';
import { ChangeControlController } from './change-control.controller';
import { CreateChangeControlUseCase } from './use-cases/create-change-control.use-case';
import { ChangeControlWorkflowUseCase } from './use-cases/change-control-workflow.use-case';
import { AssessImpactUseCase } from './use-cases/assess-impact.use-case';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
  imports: [OutboxModule],
  controllers: [ChangeControlController],
  providers: [
    ChangeControlRepository,
    CreateChangeControlUseCase,
    ChangeControlWorkflowUseCase,
    AssessImpactUseCase,
  ],
  exports: [ChangeControlRepository],
})
export class ChangeControlModule {}
