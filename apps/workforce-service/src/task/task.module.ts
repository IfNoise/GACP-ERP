import { Module } from '@nestjs/common';
import { TaskRepository } from './task.repository';
import { CreateTaskUseCase } from './use-cases/create-task.use-case';
import { CompleteTaskUseCase } from './use-cases/complete-task.use-case';
import { TaskController } from './task.controller';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
  imports: [OutboxModule],
  controllers: [TaskController],
  providers: [TaskRepository, CreateTaskUseCase, CompleteTaskUseCase],
  exports: [TaskRepository],
})
export class TaskModule {}
