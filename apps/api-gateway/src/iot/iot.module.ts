import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { KafkaProducerModule } from '../kafka/kafka-producer.module';
import { ThresholdService } from './threshold.service';
import { AlertEvaluationService } from './alert-evaluation.service';
import { AlertHistoryQueryService } from './alert-history-query.service';
import { VmProxyService } from './vm-proxy.service';
import { IotController } from './iot.controller';

/**
 * IotModule — EPIC 5: IoT & Environmental Monitoring.
 *
 * Responsibilities:
 *   - ThresholdService: CRUD for alert_thresholds table (DrizzleORM)
 *   - AlertEvaluationService: @Cron every 1 min — query VM IoT → detect breaches → emit Kafka events
 *   - VmProxyService: proxy queries to VictoriaMetrics IoT for frontend
 *   - AlertHistoryQueryService: paginated queries on alert_history table
 *   - IotController: REST endpoints per iot.contract.ts
 *
 * Database tables: alert_thresholds, alert_history (migration 002_iot.sql)
 * Kafka topic: iot.alerts.v1
 */
@Module({
  imports: [ScheduleModule.forRoot(), ConfigModule, KafkaProducerModule],
  controllers: [IotController],
  providers: [ThresholdService, AlertEvaluationService, VmProxyService, AlertHistoryQueryService],
  exports: [ThresholdService],
})
export class IotModule {}
