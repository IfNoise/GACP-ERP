import { Module } from '@nestjs/common';
import { FacilityRepository } from './facility.repository';
import { BuildingRepository } from './building.repository';
import { RoomRepository } from './room.repository';
import { ZoneRepository } from './zone.repository';
import { CreateFacilityUseCase } from './use-cases/create-facility.use-case';
import { CreateBuildingUseCase } from './use-cases/create-building.use-case';
import { CreateRoomUseCase } from './use-cases/create-room.use-case';
import { CreateZoneUseCase } from './use-cases/create-zone.use-case';
import { FacilityController } from './facility.controller';
import { BuildingController } from './building.controller';
import { RoomController } from './room.controller';
import { ZoneController } from './zone.controller';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
  imports: [OutboxModule],
  controllers: [FacilityController, BuildingController, RoomController, ZoneController],
  providers: [
    FacilityRepository,
    BuildingRepository,
    RoomRepository,
    ZoneRepository,
    CreateFacilityUseCase,
    CreateBuildingUseCase,
    CreateRoomUseCase,
    CreateZoneUseCase,
  ],
  exports: [FacilityRepository, BuildingRepository, RoomRepository, ZoneRepository],
})
export class FacilityModule {}
