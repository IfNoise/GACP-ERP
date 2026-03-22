import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MetricsModule } from '@gacp-erp/shared-config';
import { DatabaseModule } from './database/database.module';
import { OutboxModule } from './outbox/outbox.module';
import { EmployeeModule } from './employee/employee.module';
import { TaskModule } from './task/task.module';
import { TimeEntryModule } from './time-entry/time-entry.module';
import { TrainingModule } from './training/training.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../docker/.env', '../../docker/.env.example'],
    }),
    DatabaseModule,
    OutboxModule,
    EmployeeModule,
    TaskModule,
    TimeEntryModule,
    TrainingModule,
    MetricsModule,
  ],
})
export class AppModule {}
