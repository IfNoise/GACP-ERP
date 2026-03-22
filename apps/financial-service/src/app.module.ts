import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MetricsModule } from '@gacp-erp/shared-config';
import { DatabaseModule } from './database/database.module';
import { OutboxModule } from './outbox/outbox.module';
import { FinancialModule } from './account/financial.module';
import { ProcurementModule } from './procurement/procurement.module';
import { SpatialModule } from './spatial/spatial.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../docker/.env', '../../docker/.env.example'],
    }),
    DatabaseModule,
    OutboxModule,
    FinancialModule,
    ProcurementModule,
    SpatialModule,
    MetricsModule,
  ],
})
export class AppModule {}
