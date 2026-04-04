import { Module } from '@nestjs/common';
import { PlantsService } from './plants.service';
import { PlantsRepository } from './plants.repository';
import { PlantsController } from './plants.controller';
import { CreatePlantUseCase } from './use-cases/create-plant.use-case';
import { TransitionStageUseCase } from './use-cases/transition-stage.use-case';
import { MovePlantUseCase } from './use-cases/move-plant.use-case';
import { QrModule } from '../qr/qr.module';
import { OutboxModule } from '../outbox/outbox.module';
import { FacilityModule } from '../facilities/facility.module';

@Module({
  imports: [QrModule, OutboxModule, FacilityModule],
  controllers: [PlantsController],
  providers: [
    PlantsService,
    PlantsRepository,
    CreatePlantUseCase,
    TransitionStageUseCase,
    MovePlantUseCase,
  ],
  exports: [PlantsService, PlantsRepository],
})
export class PlantsModule {}
