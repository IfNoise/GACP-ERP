import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { MetricsModule, createLoggerOptions } from '@gacp-erp/shared-config';
import { DatabaseModule } from './database/database.module';
import { KeycloakModule } from './keycloak/keycloak.module';
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
    LoggerModule.forRoot(createLoggerOptions('workforce-service')),
    DatabaseModule,
    KeycloakModule,
    OutboxModule,
    EmployeeModule,
    TaskModule,
    TimeEntryModule,
    TrainingModule,
    MetricsModule,
  ],
})
export class AppModule {}
