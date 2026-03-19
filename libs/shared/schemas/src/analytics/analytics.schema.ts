import { z } from 'zod';

// ─── KPI METRIC ───────────────────────────────────────────────────────────────
export const KpiMetricSchema = z.object({
  name: z.string(),
  value: z.number(),
  target: z.number().nullable(),
  unit: z.string(),
  period: z.string(),
  trend: z.enum(['UP', 'DOWN', 'STABLE']),
});
export type KpiMetric = z.infer<typeof KpiMetricSchema>;
/** getKpis() returns an array of KPI metric objects. */
export type KpiResult = KpiMetric[];

// ─── TRAINING COMPLIANCE RESULT ───────────────────────────────────────────────
export const TrainingComplianceItemSchema = z.object({
  courseId: z.string().uuid(),
  courseCode: z.string(),
  courseTitle: z.string(),
  totalEmployees: z.number().int().nonnegative(),
  compliant: z.number().int().nonnegative(),
  expiringSoon: z.number().int().nonnegative(),
  expired: z.number().int().nonnegative(),
  complianceRate: z.number().min(0).max(100),
});
export type TrainingComplianceItem = z.infer<typeof TrainingComplianceItemSchema>;

export const TrainingComplianceResultSchema = z.object({
  period: z.string(),
  overallRate: z.number().min(0).max(100),
  items: z.array(TrainingComplianceItemSchema),
});
export type TrainingComplianceResult = z.infer<typeof TrainingComplianceResultSchema>;

// ─── WORKFORCE SUMMARY RESULT ─────────────────────────────────────────────────
export const WorkforceDeptSummarySchema = z.object({
  department: z.string(),
  employeeCount: z.number().int().nonnegative(),
  taskCompletionRate: z.number().min(0).max(100),
  laborHours: z.number().nonnegative(),
});
export type WorkforceDeptSummary = z.infer<typeof WorkforceDeptSummarySchema>;

export const WorkforceSummaryResultSchema = z.object({
  period: z.string(),
  totalEmployees: z.number().int().nonnegative(),
  activeEmployees: z.number().int().nonnegative(),
  totalTasksScheduled: z.number().int().nonnegative(),
  totalTasksCompleted: z.number().int().nonnegative(),
  totalTasksOverdue: z.number().int().nonnegative(),
  taskCompletionRate: z.number().min(0).max(100),
  totalLaborHours: z.number().nonnegative(),
  byDepartment: z.array(WorkforceDeptSummarySchema),
});
export type WorkforceSummaryResult = z.infer<typeof WorkforceSummaryResultSchema>;

// ─── AUDIT READINESS RESULT ───────────────────────────────────────────────────
export const AuditReadinessCategorySchema = z.object({
  category: z.string(),
  score: z.number().min(0).max(100),
  findings: z.number().int().nonnegative(),
  criticalFindings: z.number().int().nonnegative(),
});
export type AuditReadinessCategory = z.infer<typeof AuditReadinessCategorySchema>;

export const AuditReadinessResultSchema = z.object({
  overallScore: z.number().min(0).max(100),
  assessedAt: z.string().datetime({ offset: true }),
  categories: z.array(AuditReadinessCategorySchema),
  trainingComplianceRate: z.number().min(0).max(100),
  overdueTaskRate: z.number().min(0).max(100),
  openCapaCount: z.number().int().nonnegative(),
  criticalCapaCount: z.number().int().nonnegative(),
});
export type AuditReadinessResult = z.infer<typeof AuditReadinessResultSchema>;
