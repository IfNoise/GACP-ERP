import { Module } from '@nestjs/common';
import { DeviationRepository } from './deviation.repository';
import { DeviationController } from './deviation.controller';
import { DeviationWorkflowUseCase } from './use-cases/deviation-workflow.use-case';
import { OutboxModule } from '../outbox/outbox.module';
import { CapaModule } from '../capa/capa.module';

@Module({
  imports: [OutboxModule, CapaModule],
  controllers: [DeviationController],
  providers: [DeviationRepository, DeviationWorkflowUseCase],
  exports: [DeviationRepository],
})
export class DeviationModule {}
