import { Module } from '@nestjs/common';
import { CapaRepository } from './capa.repository';
import { CapaController } from './capa.controller';
import { CapaWorkflowUseCase } from './use-cases/capa-workflow.use-case';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
  imports: [OutboxModule],
  controllers: [CapaController],
  providers: [CapaRepository, CapaWorkflowUseCase],
  exports: [CapaRepository],
})
export class CapaModule {}
