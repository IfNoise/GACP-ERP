import { Module } from '@nestjs/common';
import {
  PrometheusModule,
  makeCounterProvider,
  makeHistogramProvider,
  makeGaugeProvider,
} from '@willsoto/nestjs-prometheus';

/** GACP-ERP business metric providers shared across services. */
const businessMetrics = [
  // ─── Audit ────────────────────────────────────────────────────────────────
  makeCounterProvider({
    name: 'gacp_audit_events_total',
    help: 'Total number of audit trail events',
    labelNames: ['event_type', 'service'],
  }),

  // ─── Signatures ───────────────────────────────────────────────────────────
  makeCounterProvider({
    name: 'gacp_signatures_created_total',
    help: 'Total electronic signatures created',
    labelNames: ['signature_type', 'service'],
  }),

  // ─── Cultivation ──────────────────────────────────────────────────────────
  makeGaugeProvider({
    name: 'gacp_cultivation_active_plants',
    help: 'Current number of active plants',
    labelNames: ['zone'],
  }),
  makeCounterProvider({
    name: 'gacp_cultivation_harvests_total',
    help: 'Total harvests completed',
    labelNames: ['strain'],
  }),

  // ─── Quality ──────────────────────────────────────────────────────────────
  makeGaugeProvider({
    name: 'gacp_quality_open_capas',
    help: 'Number of open CAPA records',
    labelNames: ['priority'],
  }),
  makeCounterProvider({
    name: 'gacp_quality_inspections_total',
    help: 'Total quality inspections performed',
    labelNames: ['result'],
  }),

  // ─── IoT / Alerts ────────────────────────────────────────────────────────
  makeCounterProvider({
    name: 'gacp_iot_alerts_triggered_total',
    help: 'Total IoT threshold alerts triggered',
    labelNames: ['sensor_type', 'alert_level'],
  }),
  makeGaugeProvider({
    name: 'gacp_iot_active_thresholds',
    help: 'Number of currently active alert thresholds',
    labelNames: ['zone_id'],
  }),

  // ─── HTTP ─────────────────────────────────────────────────────────────────
  makeHistogramProvider({
    name: 'gacp_http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  }),
];

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: { enabled: true },
    }),
  ],
  providers: [...businessMetrics],
  exports: [PrometheusModule, ...businessMetrics],
})
export class MetricsModule {}
