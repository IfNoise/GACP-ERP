import { Module } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { BatchesRepository } from './batches.repository';
import { BatchesController } from './batches.controller';
import { KafkaProducerModule } from '../kafka/kafka-producer.module';

@Module({
  imports: [KafkaProducerModule],
  controllers: [BatchesController],
  providers: [BatchesService, BatchesRepository],
  exports: [BatchesService],
})
export class BatchesModule {}
