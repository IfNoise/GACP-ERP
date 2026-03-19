import { Module } from '@nestjs/common';
import { TimeEntryRepository } from './time-entry.repository';
import { ClockInUseCase } from './use-cases/clock-in.use-case';
import { TimeEntryController } from './time-entry.controller';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
  imports: [OutboxModule],
  controllers: [TimeEntryController],
  providers: [TimeEntryRepository, ClockInUseCase],
  exports: [TimeEntryRepository],
})
export class TimeEntryModule {}
