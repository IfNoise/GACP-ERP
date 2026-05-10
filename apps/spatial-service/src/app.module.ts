import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { MetricsModule, createLoggerOptions } from '@gacp-erp/shared-config';
import { DatabaseModule } from './database/database.module';
import { OutboxModule } from './outbox/outbox.module';
import { SpatialModule } from './spatial/spatial.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../docker/.env', '../../docker/.env.example'],
    }),
    LoggerModule.forRoot(createLoggerOptions('spatial-service')),
    DatabaseModule,
    OutboxModule,
    SpatialModule,
    MetricsModule,
  ],
})
export class AppModule {}
