import { Module } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { BatchesRepository } from './batches.repository';
import { BatchesController } from './batches.controller';
import { HarvestBatchUseCase } from './use-cases/harvest-batch.use-case';
import { CloneBatchUseCase } from './use-cases/clone-batch.use-case';
import { OutboxModule } from '../outbox/outbox.module';
import { KafkaProducerModule } from '../kafka/kafka-producer.module';
import { PlantsModule } from '../plants/plants.module';
import { FacilityModule } from '../facilities/facility.module';

@Module({
  imports: [OutboxModule, KafkaProducerModule, PlantsModule, FacilityModule],
  controllers: [BatchesController],
  providers: [BatchesService, BatchesRepository, HarvestBatchUseCase, CloneBatchUseCase],
  exports: [BatchesService, HarvestBatchUseCase, CloneBatchUseCase],
})
export class BatchesModule {}
