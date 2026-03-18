import { Module } from '@nestjs/common';
import { ValidationProtocolRepository } from './validation-protocol.repository';
import { ValidationProtocolController } from './validation-protocol.controller';
import { CreateValidationProtocolUseCase } from './use-cases/create-validation-protocol.use-case';
import { ValidationProtocolWorkflowUseCase } from './use-cases/validation-protocol-workflow.use-case';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
  imports: [OutboxModule],
  controllers: [ValidationProtocolController],
  providers: [
    ValidationProtocolRepository,
    CreateValidationProtocolUseCase,
    ValidationProtocolWorkflowUseCase,
  ],
  exports: [ValidationProtocolRepository],
})
export class ValidationProtocolModule {}
