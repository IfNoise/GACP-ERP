import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { MetricsModule, createLoggerOptions } from '@gacp-erp/shared-config';
import { DatabaseModule } from './database/database.module';
import { OutboxModule } from './outbox/outbox.module';
import { ChangeControlModule } from './change-control/change-control.module';
import { CapaModule } from './capa/capa.module';
import { DeviationModule } from './deviation/deviation.module';
import { ValidationProtocolModule } from './validation-protocol/validation-protocol.module';
import { QualityEventModule } from './quality-event/quality-event.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../docker/.env', '../../docker/.env.example'],
    }),
    LoggerModule.forRoot(createLoggerOptions('quality-service')),
    DatabaseModule,
    OutboxModule,
    ChangeControlModule,
    CapaModule,
    DeviationModule,
    ValidationProtocolModule,
    QualityEventModule,
    MetricsModule,
  ],
})
export class AppModule {}
