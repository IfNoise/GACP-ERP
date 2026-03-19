import { Injectable, Inject } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import {
  employeesTable,
  tasksTable,
  trainingExecutionsTable,
  certificationsTable,
  timeEntriesTable,
  trainingCoursesTable,
  type Database,
} from '@gacp-erp/shared-database';
import {
  type KpiResult,
  type TrainingComplianceResult,
  type WorkforceSummaryResult,
  type AuditReadinessResult,
} from '@gacp-erp/shared-schemas';
import { DATABASE_TOKEN } from '../database/database.module';

@Injectable()
export class AnalyticsService {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  private currentPeriod(): string {
    return new Date().toISOString().slice(0, 7); // YYYY-MM
  }

  async getKpis(): Promise<KpiResult> {
    const period = this.currentPeriod();

    const [activeEmpResult, taskResult, trainingResult, certResult, timeResult] = await Promise.all(
      [
        this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(employeesTable)
          .where(sql`${employeesTable.is_active} = true`),
        this.db
          .select({
            total: sql<number>`count(*)::int`,
            completed: sql<number>`sum(case when ${tasksTable.status} = 'COMPLETED' then 1 else 0 end)::int`,
          })
          .from(tasksTable),
        this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(trainingExecutionsTable)
          .where(sql`${trainingExecutionsTable.status} = 'SCHEDULED'`),
        this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(certificationsTable)
          .where(sql`${certificationsTable.expiry_date} < current_date::text`),
        this.db
          .select({
            minutes: sql<number>`coalesce(sum(${timeEntriesTable.duration_minutes}), 0)::int`,
          })
          .from(timeEntriesTable),
      ],
    );

    const activeEmployees = activeEmpResult[0]?.count ?? 0;
    const totalTasks = taskResult[0]?.total ?? 0;
    const completedTasks = taskResult[0]?.completed ?? 0;
    const taskCompletionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 1000) / 10 : 0;
    const totalHoursLogged = Math.round(((timeResult[0]?.minutes ?? 0) / 60) * 10) / 10;

    return [
      {
        name: 'active_employees',
        value: activeEmployees,
        target: null,
        unit: 'employees',
        period,
        trend: 'STABLE',
      },
      {
        name: 'task_completion_rate',
        value: taskCompletionRate,
        target: 80,
        unit: '%',
        period,
        trend: taskCompletionRate >= 80 ? 'UP' : 'DOWN',
      },
      {
        name: 'pending_trainings',
        value: trainingResult[0]?.count ?? 0,
        target: 0,
        unit: 'trainings',
        period,
        trend: 'STABLE',
      },
      {
        name: 'expired_certifications',
        value: certResult[0]?.count ?? 0,
        target: 0,
        unit: 'certifications',
        period,
        trend: 'STABLE',
      },
      {
        name: 'total_hours_logged',
        value: totalHoursLogged,
        target: null,
        unit: 'hours',
        period,
        trend: 'STABLE',
      },
    ];
  }

  async getTrainingCompliance(): Promise<TrainingComplianceResult> {
    const period = this.currentPeriod();

    const [totalEmpResult, courses, certStats] = await Promise.all([
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(employeesTable)
        .where(sql`${employeesTable.is_active} = true`),
      this.db
        .select({
          id: trainingCoursesTable.id,
          course_id: trainingCoursesTable.course_id,
          title: trainingCoursesTable.title,
        })
        .from(trainingCoursesTable)
        .where(sql`${trainingCoursesTable.is_active} = true`),
      this.db
        .select({
          course_id: certificationsTable.course_id,
          compliant: sql<number>`sum(case when expiry_date >= current_date::text then 1 else 0 end)::int`,
          expiring_soon: sql<number>`sum(case when expiry_date >= current_date::text and expiry_date < (current_date + interval '30 days')::text then 1 else 0 end)::int`,
          expired: sql<number>`sum(case when expiry_date < current_date::text then 1 else 0 end)::int`,
        })
        .from(certificationsTable)
        .groupBy(certificationsTable.course_id),
    ]);

    const totalEmployees = totalEmpResult[0]?.count ?? 0;
    const certMap = new Map(certStats.map((c) => [c.course_id, c]));

    const items = courses.map((course) => {
      const stats = certMap.get(course.id);
      const compliant = stats?.compliant ?? 0;
      const expiringSoon = stats?.expiring_soon ?? 0;
      const expired = stats?.expired ?? 0;
      const complianceRate =
        totalEmployees > 0 ? Math.round((compliant / totalEmployees) * 1000) / 10 : 0;
      return {
        courseId: course.id,
        courseCode: course.course_id,
        courseTitle: course.title,
        totalEmployees,
        compliant,
        expiringSoon,
        expired,
        complianceRate,
      };
    });

    const overallRate =
      items.length > 0
        ? Math.round((items.reduce((s, i) => s + i.complianceRate, 0) / items.length) * 10) / 10
        : 0;

    return { period, overallRate, items };
  }

  async getWorkforceSummary(): Promise<WorkforceSummaryResult> {
    const period = this.currentPeriod();

    const [countResult, taskResult, laborResult, deptResult] = await Promise.all([
      this.db
        .select({
          total: sql<number>`count(*)::int`,
          active: sql<number>`sum(case when ${employeesTable.is_active} = true then 1 else 0 end)::int`,
        })
        .from(employeesTable),
      this.db
        .select({
          total: sql<number>`count(*)::int`,
          completed: sql<number>`sum(case when ${tasksTable.status} = 'COMPLETED' then 1 else 0 end)::int`,
          overdue: sql<number>`sum(case when ${tasksTable.status} = 'OVERDUE' then 1 else 0 end)::int`,
        })
        .from(tasksTable),
      this.db
        .select({
          minutes: sql<number>`coalesce(sum(${timeEntriesTable.duration_minutes}), 0)::int`,
        })
        .from(timeEntriesTable),
      this.db
        .select({
          department: employeesTable.department,
          count: sql<number>`count(*)::int`,
        })
        .from(employeesTable)
        .where(sql`${employeesTable.is_active} = true`)
        .groupBy(employeesTable.department),
    ]);

    const total = countResult[0]?.total ?? 0;
    const active = countResult[0]?.active ?? 0;
    const totalTasksScheduled = taskResult[0]?.total ?? 0;
    const totalTasksCompleted = taskResult[0]?.completed ?? 0;
    const totalTasksOverdue = taskResult[0]?.overdue ?? 0;
    const taskCompletionRate =
      totalTasksScheduled > 0
        ? Math.round((totalTasksCompleted / totalTasksScheduled) * 1000) / 10
        : 0;
    const totalLaborHours = Math.round(((laborResult[0]?.minutes ?? 0) / 60) * 10) / 10;

    return {
      period,
      totalEmployees: total,
      activeEmployees: active,
      totalTasksScheduled,
      totalTasksCompleted,
      totalTasksOverdue,
      taskCompletionRate,
      totalLaborHours,
      byDepartment: deptResult.map((r) => ({
        department: r.department,
        employeeCount: r.count,
        taskCompletionRate: 0,
        laborHours: 0,
      })),
    };
  }

  async getAuditReadiness(): Promise<AuditReadinessResult> {
    const [trainingData, taskResult] = await Promise.all([
      this.getTrainingCompliance(),
      this.db
        .select({
          total: sql<number>`count(*)::int`,
          overdue: sql<number>`sum(case when ${tasksTable.status} = 'OVERDUE' then 1 else 0 end)::int`,
        })
        .from(tasksTable),
    ]);

    const trainingComplianceRate = trainingData.overallRate;
    const totalTasks = taskResult[0]?.total ?? 0;
    const overdueTasks = taskResult[0]?.overdue ?? 0;
    const overdueTaskRate =
      totalTasks > 0 ? Math.round((overdueTasks / totalTasks) * 1000) / 10 : 0;

    const overallScore =
      Math.round((trainingComplianceRate * 0.4 + (100 - overdueTaskRate) * 0.4 + 85 * 0.2) * 10) /
      10;

    return {
      overallScore,
      assessedAt: new Date().toISOString(),
      categories: [
        {
          category: 'TRAINING_COMPLIANCE',
          score: trainingComplianceRate,
          findings: trainingData.items.filter((i) => i.expired > 0).length,
          criticalFindings: 0,
        },
        {
          category: 'TASK_COMPLETION',
          score: Math.max(0, Math.min(100, 100 - overdueTaskRate)),
          findings: overdueTasks,
          criticalFindings: 0,
        },
        {
          category: 'DOCUMENTATION',
          score: 85,
          findings: 0,
          criticalFindings: 0,
        },
      ],
      trainingComplianceRate,
      overdueTaskRate,
      openCapaCount: 0,
      criticalCapaCount: 0,
    };
  }
}
