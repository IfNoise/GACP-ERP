import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { MetricsModule, createLoggerOptions } from '@gacp-erp/shared-config';
import { PlantsModule } from './plants/plants.module';
import { BatchesModule } from './batches/batches.module';
import { StrainsModule } from './strains/strains.module';
import { QrModule } from './qr/qr.module';
import { DatabaseModule } from './database/database.module';
import { OutboxModule } from './outbox/outbox.module';
import { FacilityModule } from './facilities/facility.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../docker/.env', '../../docker/.env.example'],
    }),
    LoggerModule.forRoot(createLoggerOptions('cultivation-service')),
    DatabaseModule,
    OutboxModule,
    FacilityModule,
    StrainsModule,
    PlantsModule,
    BatchesModule,
    QrModule,
    MetricsModule,
  ],
})
export class AppModule {}
