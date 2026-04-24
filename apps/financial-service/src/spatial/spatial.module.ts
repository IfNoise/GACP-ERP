import { Module } from '@nestjs/common';
import { SpatialRepository } from './spatial.repository';
import { SpatialPlanningUseCase } from './use-cases/spatial-planning.use-case';
import { CreateRackUseCase } from './use-cases/create-rack.use-case';
import { DeleteRackUseCase } from './use-cases/delete-rack.use-case';
import { CreateTrayUseCase } from './use-cases/create-tray.use-case';
import { DeleteTrayUseCase } from './use-cases/delete-tray.use-case';
import { SpatialController } from './spatial.controller';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
  imports: [OutboxModule],
  controllers: [SpatialController],
  providers: [
    SpatialRepository,
    SpatialPlanningUseCase,
    CreateRackUseCase,
    DeleteRackUseCase,
    CreateTrayUseCase,
    DeleteTrayUseCase,
  ],
  exports: [SpatialRepository],
})
export class SpatialModule {}
