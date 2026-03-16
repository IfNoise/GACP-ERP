import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { createHash } from 'crypto';
import { randomUUID } from 'crypto';
import { type ConfigService } from '@nestjs/config';
import { type Database, alertHistoryTable } from '@gacp-erp/shared-database';
import { type AlertThreshold } from '@gacp-erp/shared-schemas';
import {
  IOT_ALERTS_TOPIC,
  type AlertTriggeredEvent,
  type ThresholdBreachedEventSchema,
} from '@gacp-erp/shared-events';
import { DATABASE_TOKEN } from '../database/database.module';
import { type KafkaProducerService } from '../kafka/kafka-producer.service';
import { type ThresholdService } from './threshold.service';
import { type z } from 'zod';

/** VictoriaMetrics instant query response */
interface VmInstantResult {
  metric: Record<string, string>;
  value: [number, string]; // [timestamp, value_string]
}

interface VmQueryResponse {
  status: 'success' | 'error';
  data: {
    resultType: string;
    result: VmInstantResult[];
  };
}

@Injectable()
export class AlertEvaluationService {
  private readonly logger = new Logger(AlertEvaluationService.name);
  private readonly vmIotBaseUrl: string;

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    config: ConfigService,
    private readonly thresholdService: ThresholdService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {
    this.vmIotBaseUrl = config.get<string>('VM_IOT_URL', 'http://victoriametrics-iot:8428');
  }

  /**
   * Runs every minute to evaluate all active thresholds against
   * the latest sensor readings from VictoriaMetrics IoT.
   *
   * Flow per threshold:
   *   1. Query VM IoT: instant query for latest gacp_sensor_reading value
   *   2. If breach detected: persist alert_history row
   *   3. Publish AlertTriggeredEvent (+ ThresholdBreachedEvent for CRITICAL) to Kafka
   */
  @Cron('*/1 * * * *')
  async evaluate(): Promise<void> {
    let thresholds: AlertThreshold[];
    try {
      thresholds = await this.thresholdService.findAllActive();
    } catch (err) {
      this.logger.error(`Failed to load active thresholds: ${String(err)}`);
      return;
    }

    if (thresholds.length === 0) return;

    await Promise.allSettled(thresholds.map((t) => this.evaluateThreshold(t)));
  }

  private async evaluateThreshold(threshold: AlertThreshold): Promise<void> {
    const sensorType = threshold.sensor_type.toLowerCase();
    const zoneId = threshold.zone_id as string;

    // PromQL: latest value for this zone + sensor type
    const query = `gacp_sensor_reading{zone_id="${zoneId}",sensor_type="${sensorType}"}`;
    const url = `${this.vmIotBaseUrl}/api/v1/query?query=${encodeURIComponent(query)}`;

    let vmResponse: VmQueryResponse;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
      if (!res.ok) {
        this.logger.warn(`VM IoT query failed (${res.status}) for threshold ${threshold.id}`);
        return;
      }
      vmResponse = (await res.json()) as VmQueryResponse;
    } catch (err) {
      this.logger.warn(`VM IoT unreachable for threshold ${threshold.id}: ${String(err)}`);
      return;
    }

    if (vmResponse.status !== 'success' || vmResponse.data.result.length === 0) {
      return; // No data yet — not a breach
    }

    // Take the latest value (first result, most recent value)
    const latestValueStr = vmResponse.data.result[0]?.value[1];
    if (latestValueStr == null) return;

    const value = parseFloat(latestValueStr);
    if (isNaN(value)) return;

    const minBreached = threshold.min_value != null && value < threshold.min_value;
    const maxBreached = threshold.max_value != null && value > threshold.max_value;

    if (!minBreached && !maxBreached) return;

    await this.recordAlert(threshold, value);
  }

  private async recordAlert(threshold: AlertThreshold, triggeredValue: number): Promise<void> {
    const triggeredAt = new Date();
    const triggeredAtIso = triggeredAt.toISOString();

    // ALCOA+ integrity hash: SHA-256(threshold_id:value:triggered_at)
    const sourceHash = createHash('sha256')
      .update(`${threshold.id}:${triggeredValue}:${triggeredAtIso}`)
      .digest('hex');

    const alertId = randomUUID();

    try {
      await this.db.insert(alertHistoryTable).values({
        id: alertId,
        threshold_id: threshold.id,
        zone_id: threshold.zone_id as string,
        sensor_type: threshold.sensor_type,
        triggered_value: String(triggeredValue),
        alert_level: threshold.alert_level,
        triggered_at: triggeredAt,
        acknowledged: false,
        source_hash: sourceHash,
      });
    } catch (err) {
      this.logger.error(`Failed to persist alert for threshold ${threshold.id}: ${String(err)}`);
      return;
    }

    // Publish AlertTriggeredEvent to Kafka
    const event: AlertTriggeredEvent = {
      eventId: randomUUID(),
      occurredAt: triggeredAtIso,
      eventVersion: '1.0',
      producerService: 'api-gateway',
      topic: IOT_ALERTS_TOPIC,
      correlationId: randomUUID(),
      triggeredBy: threshold.created_by,
      eventType: 'iot.alert.triggered',
      payload: {
        alertHistoryId: alertId,
        threshold_id: threshold.id,
        zone_id: threshold.zone_id,
        sensor_type: threshold.sensor_type,
        triggered_value: triggeredValue,
        alert_level: threshold.alert_level,
        triggered_at: triggeredAtIso,
        source_hash: sourceHash,
      },
    };

    this.kafkaProducer.publish(IOT_ALERTS_TOPIC, threshold.zone_id as string, event);

    // For CRITICAL alerts, also publish ThresholdBreachedEvent with full ALCOA+ metadata
    if (threshold.alert_level === 'CRITICAL') {
      const breachEvent: z.infer<typeof ThresholdBreachedEventSchema> = {
        eventId: randomUUID(),
        occurredAt: triggeredAtIso,
        eventVersion: '1.0',
        producerService: 'api-gateway',
        topic: IOT_ALERTS_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: threshold.created_by,
        eventType: 'iot.threshold.breached',
        payload: {
          threshold_id: threshold.id,
          zone_id: threshold.zone_id,
          sensor_type: threshold.sensor_type,
          triggered_value: triggeredValue,
          configured_min: threshold.min_value,
          configured_max: threshold.max_value,
          alert_level: threshold.alert_level,
          triggered_at: triggeredAtIso,
          threshold_created_by: threshold.created_by as string,
          threshold_updated_at: threshold.updated_at,
          source_hash: sourceHash,
        },
      };
      this.kafkaProducer.publish(IOT_ALERTS_TOPIC, threshold.zone_id as string, breachEvent);
    }

    this.logger.warn(
      `ALERT [${threshold.alert_level}] zone=${threshold.zone_id as string} ` +
        `sensor=${threshold.sensor_type} value=${triggeredValue} hash=${sourceHash.slice(0, 12)}...`,
    );
  }
}
