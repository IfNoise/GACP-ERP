import { Module } from '@nestjs/common';
import { OutboxModule } from '../outbox/outbox.module';
import { IncomingInspectionRepository } from './incoming-inspection.repository';
import { IncomingInspectionWorkflowUseCase } from './use-cases/incoming-inspection-workflow.use-case';
import { IncomingInspectionController } from './incoming-inspection.controller';
import { GoodsReceivedConsumer } from './goods-received.consumer';

@Module({
  imports: [OutboxModule],
  controllers: [IncomingInspectionController, GoodsReceivedConsumer],
  providers: [IncomingInspectionRepository, IncomingInspectionWorkflowUseCase],
  exports: [IncomingInspectionRepository],
})
export class IncomingInspectionModule {}
