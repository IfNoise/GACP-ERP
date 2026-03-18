import { Module } from '@nestjs/common';
import { SpatialRepository } from './spatial.repository';
import { SpatialPlanningUseCase } from './use-cases/spatial-planning.use-case';
import { SpatialController } from './spatial.controller';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
  imports: [OutboxModule],
  controllers: [SpatialController],
  providers: [SpatialRepository, SpatialPlanningUseCase],
  exports: [SpatialRepository],
})
export class SpatialModule {}
