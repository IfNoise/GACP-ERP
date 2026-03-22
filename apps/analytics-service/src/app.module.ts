import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MetricsModule } from '@gacp-erp/shared-config';
import { DatabaseModule } from './database/database.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../docker/.env', '../../docker/.env.example'],
    }),
    DatabaseModule,
    AnalyticsModule,
    MetricsModule,
  ],
})
export class AppModule {}
