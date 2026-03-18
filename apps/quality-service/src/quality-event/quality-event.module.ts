import { Module } from '@nestjs/common';
import { QualityEventRepository } from './quality-event.repository';
import { QualityEventController } from './quality-event.controller';
import { QualityEventWorkflowUseCase } from './use-cases/quality-event-workflow.use-case';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
  imports: [OutboxModule],
  controllers: [QualityEventController],
  providers: [QualityEventRepository, QualityEventWorkflowUseCase],
  exports: [QualityEventRepository],
})
export class QualityEventModule {}
