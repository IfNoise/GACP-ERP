import { Module } from '@nestjs/common';
import { PlantsService } from './plants.service';
import { PlantsRepository } from './plants.repository';
import { PlantsController } from './plants.controller';
import { QrModule } from '../qr/qr.module';
import { KafkaProducerModule } from '../kafka/kafka-producer.module';

@Module({
  imports: [QrModule, KafkaProducerModule],
  controllers: [PlantsController],
  providers: [PlantsService, PlantsRepository],
  exports: [PlantsService],
})
export class PlantsModule {}
