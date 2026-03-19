import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { ApiErrorSchema } from '@gacp-erp/shared-schemas';

const c = initContract();

const KpiMetricSchema = z.object({
  name: z.string(),
  value: z.number(),
  target: z.number().nullable(),
  unit: z.string(),
  period: z.string().regex(/^\d{4}-\d{2}$/),
  trend: z.enum(['UP', 'DOWN', 'STABLE']),
});

const TrainingComplianceItemSchema = z.object({
  courseId: z.string().uuid(),
  courseCode: z.string(),
  courseTitle: z.string(),
  totalEmployees: z.number().int().nonnegative(),
  compliant: z.number().int().nonnegative(),
  expiringSoon: z.number().int().nonnegative(),
  expired: z.number().int().nonnegative(),
  complianceRate: z.number().min(0).max(100),
});

const WorkforceSummarySchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/),
  totalEmployees: z.number().int().nonnegative(),
  activeEmployees: z.number().int().nonnegative(),
  totalTasksScheduled: z.number().int().nonnegative(),
  totalTasksCompleted: z.number().int().nonnegative(),
  totalTasksOverdue: z.number().int().nonnegative(),
  taskCompletionRate: z.number().min(0).max(100),
  totalLaborHours: z.number().nonnegative(),
  byDepartment: z.array(
    z.object({
      department: z.string(),
      employeeCount: z.number().int().nonnegative(),
      taskCompletionRate: z.number().min(0).max(100),
      laborHours: z.number().nonnegative(),
    }),
  ),
});

const AuditReadinessSchema = z.object({
  overallScore: z.number().min(0).max(100),
  assessedAt: z.string().datetime({ offset: true }),
  categories: z.array(
    z.object({
      category: z.string(),
      score: z.number().min(0).max(100),
      findings: z.number().int().nonnegative(),
      criticalFindings: z.number().int().nonnegative(),
    }),
  ),
  trainingComplianceRate: z.number().min(0).max(100),
  overdueTaskRate: z.number().min(0).max(100),
  openCapaCount: z.number().int().nonnegative(),
  criticalCapaCount: z.number().int().nonnegative(),
});

/**
 * Analytics API contract (EPIC 9).
 *
 * Read-only reporting service covering KPIs, training compliance,
 * workforce summaries, and audit readiness metrics.
 */
export const analyticsContract = c.router({
  // ── KPI Metrics ───────────────────────────────────────────────────────────

  getKpis: {
    method: 'GET',
    path: '/analytics/kpis',
    query: z.object({
      period: z
        .string()
        .regex(/^\d{4}-\d{2}$/)
        .optional(),
      category: z.enum(['WORKFORCE', 'TRAINING', 'QUALITY', 'COMPLIANCE']).optional(),
    }),
    responses: {
      200: z.array(KpiMetricSchema),
    },
    summary: 'Get KPI metrics for a period',
  },

  // ── Training Compliance ───────────────────────────────────────────────────

  getTrainingCompliance: {
    method: 'GET',
    path: '/analytics/training/compliance',
    query: z.object({
      period: z
        .string()
        .regex(/^\d{4}-\d{2}$/)
        .optional(),
      department: z.string().optional(),
      is_mandatory: z
        .string()
        .transform((v) => v === 'true')
        .optional(),
    }),
    responses: {
      200: z.object({
        period: z.string(),
        overallRate: z.number().min(0).max(100),
        items: z.array(TrainingComplianceItemSchema),
      }),
    },
    summary: 'Get training compliance overview',
  },

  // ── Workforce Summary ─────────────────────────────────────────────────────

  getWorkforceSummary: {
    method: 'GET',
    path: '/analytics/workforce/summary',
    query: z.object({
      period: z
        .string()
        .regex(/^\d{4}-\d{2}$/)
        .optional(),
    }),
    responses: {
      200: WorkforceSummarySchema,
      400: ApiErrorSchema,
    },
    summary: 'Get workforce activity summary for a period',
  },

  // ── Audit Readiness ───────────────────────────────────────────────────────

  getAuditReadiness: {
    method: 'GET',
    path: '/analytics/audit-readiness',
    query: z.object({}),
    responses: {
      200: AuditReadinessSchema,
    },
    summary: 'Get current audit readiness score',
  },

  // ── Employee Performance ──────────────────────────────────────────────────

  getEmployeePerformance: {
    method: 'GET',
    path: '/analytics/workforce/employees/:id/performance',
    pathParams: z.object({ id: z.string().uuid() }),
    query: z.object({
      period: z
        .string()
        .regex(/^\d{4}-\d{2}$/)
        .optional(),
    }),
    responses: {
      200: z.object({
        employeeId: z.string().uuid(),
        period: z.string(),
        tasksAssigned: z.number().int().nonnegative(),
        tasksCompleted: z.number().int().nonnegative(),
        taskCompletionRate: z.number().min(0).max(100),
        laborHours: z.number().nonnegative(),
        trainingComplianceRate: z.number().min(0).max(100),
        certifications: z.number().int().nonnegative(),
        expiredCertifications: z.number().int().nonnegative(),
      }),
      404: ApiErrorSchema,
    },
    summary: 'Get performance metrics for a single employee',
  },
});
