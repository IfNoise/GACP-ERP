import { z } from 'zod';
import { EventHeaderSchema } from './base.events';

// ─── KAFKA TOPICS ─────────────────────────────────────────────────────────────
export const ANALYTICS_REPORT_TOPIC = 'analytics.report.v1' as const;

// ════════════════════════════════════════════════════════════════════════════════
// ANALYTICS EVENTS — topic: analytics.report.v1
// ════════════════════════════════════════════════════════════════════════════════

export const ComplianceReportGeneratedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('analytics.compliance_report.generated'),
  topic: z.literal(ANALYTICS_REPORT_TOPIC),
  payload: z.object({
    reportId: z.string().uuid(),
    reportType: z.enum([
      'TRAINING_COMPLIANCE',
      'WORKFORCE_SUMMARY',
      'QUALITY_KPI',
      'AUDIT_READINESS',
    ]),
    period: z.string().regex(/^\d{4}-\d{2}$/),
    overallScore: z.number().min(0).max(100),
    generatedBy: z.string().uuid(),
    generatedAt: z.string().datetime({ offset: true }),
    documentId: z.string().uuid().nullable(),
  }),
});
export type ComplianceReportGeneratedEvent = z.infer<typeof ComplianceReportGeneratedEventSchema>;

export const KpiThresholdBreakedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('analytics.kpi.threshold_breached'),
  topic: z.literal(ANALYTICS_REPORT_TOPIC),
  payload: z.object({
    kpiName: z.string(),
    kpiValue: z.number(),
    threshold: z.number(),
    direction: z.enum(['ABOVE', 'BELOW']),
    period: z.string().regex(/^\d{4}-\d{2}$/),
    severity: z.enum(['CRITICAL', 'WARNING', 'INFO']),
  }),
});
export type KpiThresholdBreakedEvent = z.infer<typeof KpiThresholdBreakedEventSchema>;
