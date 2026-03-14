import { Module } from '@nestjs/common';
import { PlantsService } from './plants.service';
import { PlantsRepository } from './plants.repository';

@Module({
  providers: [PlantsService, PlantsRepository],
  exports: [PlantsService],
})
export class PlantsModule {}
