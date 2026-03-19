import { Module } from '@nestjs/common';
import { TrainingRepository } from './training.repository';
import { ScheduleTrainingUseCase } from './use-cases/schedule-training.use-case';
import { CompleteTrainingUseCase } from './use-cases/complete-training.use-case';
import { TrainingController } from './training.controller';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
  imports: [OutboxModule],
  controllers: [TrainingController],
  providers: [TrainingRepository, ScheduleTrainingUseCase, CompleteTrainingUseCase],
  exports: [TrainingRepository],
})
export class TrainingModule {}
