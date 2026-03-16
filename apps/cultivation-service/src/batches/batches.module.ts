import { Module } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { BatchesRepository } from './batches.repository';
import { BatchesController } from './batches.controller';
import { HarvestBatchUseCase } from './use-cases/harvest-batch.use-case';
import { OutboxModule } from '../outbox/outbox.module';
import { KafkaProducerModule } from '../kafka/kafka-producer.module';

@Module({
  imports: [OutboxModule, KafkaProducerModule],
  controllers: [BatchesController],
  providers: [BatchesService, BatchesRepository, HarvestBatchUseCase],
  exports: [BatchesService, HarvestBatchUseCase],
})
export class BatchesModule {}
