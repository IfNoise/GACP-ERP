import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MetricsModule } from '@gacp-erp/shared-config';
import { PlantsModule } from './plants/plants.module';
import { BatchesModule } from './batches/batches.module';
import { QrModule } from './qr/qr.module';
import { DatabaseModule } from './database/database.module';
import { OutboxModule } from './outbox/outbox.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../docker/.env', '../../docker/.env.example'],
    }),
    DatabaseModule,
    OutboxModule,
    PlantsModule,
    BatchesModule,
    QrModule,
    MetricsModule,
  ],
})
export class AppModule {}
