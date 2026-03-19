import { AnalyticsService } from './analytics.service';
import type { Database } from '@gacp-erp/shared-database';

// ─── DB mock helpers ───────────────────────────────────────────────────────────

/**
 * Creates a Drizzle-compatible query chain mock that resolves to `result`.
 * Supports chaining: .from().where(), .from().groupBy(), .from().where().groupBy().
 */
function makeSelectChain(result: readonly unknown[]) {
  const resolved = Promise.resolve([...result]);
  const chainable = {
    where: jest.fn(),
    groupBy: jest.fn(),
    then: resolved.then.bind(resolved),
    catch: resolved.catch.bind(resolved),
    finally: resolved.finally.bind(resolved),
  } as {
    where: jest.Mock;
    groupBy: jest.Mock;
    then: typeof resolved.then;
    catch: typeof resolved.catch;
    finally: typeof resolved.finally;
  };
  chainable.where.mockReturnValue(chainable);
  chainable.groupBy.mockReturnValue(chainable);
  return { from: jest.fn().mockReturnValue(chainable) };
}

function makeMockDb(...selectResults: readonly unknown[][]): jest.Mocked<Pick<Database, 'select'>> {
  const selectFn = jest.fn();
  selectResults.forEach((result) => selectFn.mockReturnValueOnce(makeSelectChain(result)));
  return { select: selectFn } as unknown as jest.Mocked<Pick<Database, 'select'>>;
}

const COURSE_UUID = '00000000-0000-0000-0000-000000000001';

// ─── AnalyticsService — unit tests ────────────────────────────────────────────

describe('AnalyticsService', () => {
  // ── IQ: Installation Qualification ───────────────────────────────────────

  describe('IQ: instantiation', () => {
    it('creates service with injected db', () => {
      const db = makeMockDb();
      const svc = new AnalyticsService(db as unknown as Database);
      expect(svc).toBeDefined();
    });
  });

  // ── OQ: Operational Qualification ────────────────────────────────────────

  describe('OQ: getKpis()', () => {
    it('returns array of KPI metrics with correct values', async () => {
      const db = makeMockDb(
        [{ count: 42 }], // activeEmployees
        [{ total: 100, completed: 73 }], // tasks
        [{ count: 5 }], // pendingTrainings
        [{ count: 3 }], // expiredCertifications
        [{ minutes: 4800 }], // time entries (80 h)
      );
      const svc = new AnalyticsService(db as unknown as Database);

      const result = await svc.getKpis();

      expect(Array.isArray(result)).toBe(true);
      expect(result.find((m) => m.name === 'active_employees')?.value).toBe(42);
      expect(result.find((m) => m.name === 'task_completion_rate')?.value).toBe(73);
      expect(result.find((m) => m.name === 'pending_trainings')?.value).toBe(5);
      expect(result.find((m) => m.name === 'expired_certifications')?.value).toBe(3);
      expect(result.find((m) => m.name === 'total_hours_logged')?.value).toBe(80);
    });

    it('returns 0 task_completion_rate when totalTasks is 0', async () => {
      const db = makeMockDb(
        [{ count: 0 }],
        [{ total: 0, completed: 0 }],
        [{ count: 0 }],
        [{ count: 0 }],
        [{ minutes: 0 }],
      );
      const svc = new AnalyticsService(db as unknown as Database);

      const result = await svc.getKpis();

      expect(result.find((m) => m.name === 'task_completion_rate')?.value).toBe(0);
      expect(result.find((m) => m.name === 'total_hours_logged')?.value).toBe(0);
    });

    it('rounds task_completion_rate to 1 decimal', async () => {
      const db = makeMockDb(
        [{ count: 10 }],
        [{ total: 3, completed: 1 }], // 33.333... → 33.3
        [{ count: 0 }],
        [{ count: 0 }],
        [{ minutes: 0 }],
      );
      const svc = new AnalyticsService(db as unknown as Database);

      const result = await svc.getKpis();

      expect(result.find((m) => m.name === 'task_completion_rate')?.value).toBe(33.3);
    });
  });

  describe('OQ: getTrainingCompliance()', () => {
    it('computes per-course compliance from certifications', async () => {
      const db = makeMockDb(
        [{ count: 100 }], // totalEmployees
        [{ id: COURSE_UUID, course_id: 'CUR-001', title: 'GMP Fundamentals' }], // courses
        [{ course_id: COURSE_UUID, compliant: 80, expiring_soon: 5, expired: 10 }], // certStats
      );
      const svc = new AnalyticsService(db as unknown as Database);

      const result = await svc.getTrainingCompliance();

      expect(result.overallRate).toBe(80);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.courseCode).toBe('CUR-001');
      expect(result.items[0]?.compliant).toBe(80);
      expect(result.items[0]?.expired).toBe(10);
      expect(result.items[0]?.complianceRate).toBe(80); // 80/100 * 100
    });

    it('returns 0 overallRate when no courses', async () => {
      const db = makeMockDb([{ count: 0 }], [], []);
      const svc = new AnalyticsService(db as unknown as Database);

      const result = await svc.getTrainingCompliance();

      expect(result.overallRate).toBe(0);
      expect(result.items).toHaveLength(0);
    });
  });

  describe('OQ: getWorkforceSummary()', () => {
    it('returns summary with task counts and department breakdown', async () => {
      const db = makeMockDb(
        [{ total: 50, active: 45 }], // countResult
        [{ total: 100, completed: 80, overdue: 5 }], // taskResult
        [{ minutes: 4800 }], // laborResult (80 h)
        [
          { department: 'Cultivation', count: 30 },
          { department: 'Processing', count: 15 },
        ], // deptResult
      );
      const svc = new AnalyticsService(db as unknown as Database);

      const result = await svc.getWorkforceSummary();

      expect(result.totalEmployees).toBe(50);
      expect(result.activeEmployees).toBe(45);
      expect(result.totalTasksScheduled).toBe(100);
      expect(result.totalTasksCompleted).toBe(80);
      expect(result.totalTasksOverdue).toBe(5);
      expect(result.taskCompletionRate).toBe(80);
      expect(result.totalLaborHours).toBe(80);
      expect(result.byDepartment).toHaveLength(2);
      expect(result.byDepartment[0]).toMatchObject({
        department: 'Cultivation',
        employeeCount: 30,
      });
    });
  });

  // ── PQ: Performance Qualification — formulas and edge cases ───────────────

  describe('PQ: getAuditReadiness()', () => {
    it('computes overallScore with weighted formula (training×0.4 + task×0.4 + doc×0.2)', async () => {
      // getTrainingCompliance: 3 queries
      // + 1 direct taskResult query
      const db = makeMockDb(
        [{ count: 100 }], // totalEmployees
        [{ id: COURSE_UUID, course_id: 'CUR-001', title: 'Test Course' }], // courses
        [{ course_id: COURSE_UUID, compliant: 90, expiring_soon: 0, expired: 10 }], // certStats → overallRate=90
        [{ total: 100, overdue: 10 }], // taskResult → overdueTaskRate=10
      );
      const svc = new AnalyticsService(db as unknown as Database);

      const result = await svc.getAuditReadiness();

      // overallScore = Math.round((90×0.4 + (100-10)×0.4 + 85×0.2) × 10) / 10
      //             = Math.round((36 + 36 + 17) × 10) / 10
      //             = Math.round(890) / 10 = 89
      expect(result.overallScore).toBe(89);
      expect(result.trainingComplianceRate).toBe(90);
      expect(result.overdueTaskRate).toBe(10);
      expect(result.openCapaCount).toBe(0);
      expect(result.criticalCapaCount).toBe(0);
      expect(result.categories).toHaveLength(3);
    });

    it('returns assessedAt as ISO datetime string', async () => {
      const db = makeMockDb([{ count: 0 }], [], [], [{ total: 0, overdue: 0 }]);
      const svc = new AnalyticsService(db as unknown as Database);

      const result = await svc.getAuditReadiness();

      expect(result.assessedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });
});
