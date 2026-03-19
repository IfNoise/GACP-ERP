import { Module } from '@nestjs/common';
import { EmployeeRepository } from './employee.repository';
import { CreateEmployeeUseCase } from './use-cases/create-employee.use-case';
import { EmployeeController } from './employee.controller';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
  imports: [OutboxModule],
  controllers: [EmployeeController],
  providers: [EmployeeRepository, CreateEmployeeUseCase],
  exports: [EmployeeRepository],
})
export class EmployeeModule {}
