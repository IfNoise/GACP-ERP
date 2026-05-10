import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { MetricsModule, createLoggerOptions } from '@gacp-erp/shared-config';
import { DatabaseModule } from './database/database.module';
import { OutboxModule } from './outbox/outbox.module';
import { FinancialModule } from './account/financial.module';
import { ProcurementModule } from './procurement/procurement.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../docker/.env', '../../docker/.env.example'],
    }),
    LoggerModule.forRoot(createLoggerOptions('financial-service')),
    DatabaseModule,
    OutboxModule,
    FinancialModule,
    ProcurementModule,
    MetricsModule,
  ],
})
export class AppModule {}
