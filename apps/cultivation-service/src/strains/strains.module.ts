import { Module } from '@nestjs/common';
import { StrainsController } from './strains.controller';
import { StrainsService } from './strains.service';
import { StrainsRepository } from './strains.repository';
import { CreateStrainUseCase } from './use-cases/create-strain.use-case';
import { UpdateStrainUseCase } from './use-cases/update-strain.use-case';
import { DeactivateStrainUseCase } from './use-cases/deactivate-strain.use-case';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
  imports: [OutboxModule],
  controllers: [StrainsController],
  providers: [
    StrainsService,
    StrainsRepository,
    CreateStrainUseCase,
    UpdateStrainUseCase,
    DeactivateStrainUseCase,
  ],
  exports: [StrainsService, StrainsRepository],
})
export class StrainsModule {}
