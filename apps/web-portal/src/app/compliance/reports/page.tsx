import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

interface KpiData {
  activeEmployees: number;
  totalTasks: number;
  completedTasks: number;
  taskCompletionRate: number;
  pendingTrainings: number;
  expiredCertifications: number;
  totalHoursLogged: number;
}

interface WorkforceSummaryData {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  byDepartment: Array<{ department: string; count: number }>;
}

interface AuditReadinessData {
  overallScore: number;
  trainingCompliance: number;
  documentationCompliance: number;
  taskCompletionRate: number;
  certificationCoverage: number;
}

const BASE_URL = process.env['ANALYTICS_SERVICE_URL'] ?? 'http://localhost:3006/internal';

async function fetchAnalytics<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export default async function ComplianceReportsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const [kpis, workforce, auditReadiness] = await Promise.all([
    fetchAnalytics<KpiData>('/v1/analytics/kpis'),
    fetchAnalytics<WorkforceSummaryData>('/v1/analytics/workforce-summary'),
    fetchAnalytics<AuditReadinessData>('/v1/analytics/audit-readiness'),
  ]);

  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Compliance Reports</h1>
            <p className="text-sm text-gray-500 mt-1">Generated: {reportDate}</p>
          </div>
          <Link href="/compliance" className="text-sm text-blue-600 hover:underline">
            ← Compliance Dashboard
          </Link>
        </div>

        {/* Audit Readiness Summary */}
        {auditReadiness && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Audit Readiness Summary</h2>
            <p className="text-xs text-gray-400 mb-4">
              Per EU GMP Annex 11 / 21 CFR Part 11 / WHO GACP
            </p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              {[
                { label: 'Overall Score', value: auditReadiness.overallScore },
                { label: 'Training Compliance', value: auditReadiness.trainingCompliance },
                { label: 'Cert Coverage', value: auditReadiness.certificationCoverage },
                { label: 'Task Completion', value: auditReadiness.taskCompletionRate },
                { label: 'Documentation', value: auditReadiness.documentationCompliance },
              ].map(({ label, value }) => (
                <div key={label} className="text-center rounded-lg bg-gray-50 p-3">
                  <div
                    className={`text-2xl font-bold ${
                      value >= 80
                        ? 'text-green-600'
                        : value >= 60
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    }`}
                  >
                    {value.toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KPI Summary Table */}
        {kpis && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Key Performance Indicators</h2>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-2 text-gray-500">Active Employees</td>
                  <td className="py-2 font-semibold text-right">{kpis.activeEmployees}</td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-500">Total Tasks</td>
                  <td className="py-2 font-semibold text-right">{kpis.totalTasks}</td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-500">Completed Tasks</td>
                  <td className="py-2 font-semibold text-right">{kpis.completedTasks}</td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-500">Task Completion Rate</td>
                  <td className="py-2 font-semibold text-right">
                    {kpis.taskCompletionRate.toFixed(1)}%
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-500">Pending Trainings</td>
                  <td
                    className={`py-2 font-semibold text-right ${kpis.pendingTrainings > 0 ? 'text-yellow-600' : 'text-green-600'}`}
                  >
                    {kpis.pendingTrainings}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-500">Expired Certifications</td>
                  <td
                    className={`py-2 font-semibold text-right ${kpis.expiredCertifications > 0 ? 'text-red-600' : 'text-green-600'}`}
                  >
                    {kpis.expiredCertifications}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-500">Total Hours Logged</td>
                  <td className="py-2 font-semibold text-right">{kpis.totalHoursLogged}h</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Workforce by Department */}
        {workforce && workforce.byDepartment.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Workforce by Department</h2>
            <div className="space-y-2">
              {workforce.byDepartment
                .sort((a, b) => b.count - a.count)
                .map(({ department, count }) => {
                  const pct =
                    workforce.activeEmployees > 0 ? (count / workforce.activeEmployees) * 100 : 0;
                  return (
                    <div key={department} className="flex items-center gap-3">
                      <div className="w-32 text-sm text-gray-600 truncate">{department}</div>
                      <div className="flex-1 h-4 rounded-full bg-gray-100">
                        <div
                          className="h-4 rounded-full bg-blue-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="w-8 text-right text-sm font-medium">{count}</div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
