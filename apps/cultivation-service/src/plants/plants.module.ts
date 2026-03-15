import { Module } from '@nestjs/common';
import { PlantsService } from './plants.service';
import { PlantsRepository } from './plants.repository';
import { PlantsController } from './plants.controller';
import { QrModule } from '../qr/qr.module';

@Module({
  imports: [QrModule],
  controllers: [PlantsController],
  providers: [PlantsService, PlantsRepository],
  exports: [PlantsService],
})
export class PlantsModule {}
