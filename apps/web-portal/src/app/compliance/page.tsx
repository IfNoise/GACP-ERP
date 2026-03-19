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

interface TrainingComplianceData {
  totalEmployees: number;
  employeesWithActiveCert: number;
  complianceRate: number;
  overdueTrainings: number;
}

interface AuditReadinessData {
  overallScore: number;
  trainingCompliance: number;
  documentationCompliance: number;
  taskCompletionRate: number;
  certificationCoverage: number;
}

async function fetchKpis(): Promise<KpiData | null> {
  const base = process.env['ANALYTICS_SERVICE_URL'] ?? 'http://localhost:3006/internal';
  try {
    const res = await fetch(`${base}/v1/analytics/kpis`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json() as Promise<KpiData>;
  } catch {
    return null;
  }
}

async function fetchTrainingCompliance(): Promise<TrainingComplianceData | null> {
  const base = process.env['ANALYTICS_SERVICE_URL'] ?? 'http://localhost:3006/internal';
  try {
    const res = await fetch(`${base}/v1/analytics/training-compliance`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json() as Promise<TrainingComplianceData>;
  } catch {
    return null;
  }
}

async function fetchAuditReadiness(): Promise<AuditReadinessData | null> {
  const base = process.env['ANALYTICS_SERVICE_URL'] ?? 'http://localhost:3006/internal';
  try {
    const res = await fetch(`${base}/v1/analytics/audit-readiness`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json() as Promise<AuditReadinessData>;
  } catch {
    return null;
  }
}

function ScoreBar({ value, label }: { value: number; label: string }) {
  const color = value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold">{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 rounded-full bg-gray-200">
        <div
          className={`h-2 rounded-full ${color} transition-all`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default async function ComplianceDashboardPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const [kpis, training, auditReadiness] = await Promise.all([
    fetchKpis(),
    fetchTrainingCompliance(),
    fetchAuditReadiness(),
  ]);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Compliance Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              Real-time workforce &amp; training compliance overview — EU GMP Annex 11 / 21 CFR Part
              11
            </p>
          </div>
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Audit Readiness Score */}
        {auditReadiness && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Audit Readiness</h2>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4 mb-6">
              <div className="text-center">
                <div
                  className={`text-4xl font-bold ${
                    auditReadiness.overallScore >= 80
                      ? 'text-green-600'
                      : auditReadiness.overallScore >= 60
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {auditReadiness.overallScore.toFixed(0)}
                </div>
                <div className="text-xs text-gray-500 mt-1">Overall Score</div>
              </div>
            </div>
            <div className="space-y-3">
              <ScoreBar value={auditReadiness.trainingCompliance} label="Training Compliance" />
              <ScoreBar
                value={auditReadiness.certificationCoverage}
                label="Certification Coverage"
              />
              <ScoreBar value={auditReadiness.taskCompletionRate} label="Task Completion Rate" />
              <ScoreBar
                value={auditReadiness.documentationCompliance}
                label="Documentation Compliance"
              />
            </div>
          </div>
        )}

        {/* KPI Cards */}
        {kpis && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-3xl font-bold text-blue-600">{kpis.activeEmployees}</div>
              <div className="text-sm text-gray-500 mt-1">Active Employees</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-3xl font-bold text-green-600">
                {kpis.taskCompletionRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500 mt-1">Task Completion</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div
                className={`text-3xl font-bold ${kpis.pendingTrainings > 0 ? 'text-yellow-600' : 'text-green-600'}`}
              >
                {kpis.pendingTrainings}
              </div>
              <div className="text-sm text-gray-500 mt-1">Pending Trainings</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div
                className={`text-3xl font-bold ${kpis.expiredCertifications > 0 ? 'text-red-600' : 'text-green-600'}`}
              >
                {kpis.expiredCertifications}
              </div>
              <div className="text-sm text-gray-500 mt-1">Expired Certifications</div>
            </div>
          </div>
        )}

        {/* Training Compliance Summary */}
        {training && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Training Compliance</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <div className="text-2xl font-bold text-gray-800">{training.totalEmployees}</div>
                <div className="text-xs text-gray-500">Total Employees</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {training.employeesWithActiveCert}
                </div>
                <div className="text-xs text-gray-500">Active Certifications</div>
              </div>
              <div>
                <div
                  className={`text-2xl font-bold ${training.complianceRate >= 90 ? 'text-green-600' : training.complianceRate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}
                >
                  {training.complianceRate.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">Compliance Rate</div>
              </div>
              <div>
                <div
                  className={`text-2xl font-bold ${training.overdueTrainings > 0 ? 'text-red-600' : 'text-green-600'}`}
                >
                  {training.overdueTrainings}
                </div>
                <div className="text-xs text-gray-500">Overdue Trainings</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link
            href="/compliance/training"
            className="rounded-xl border border-blue-100 bg-blue-50 p-5 hover:bg-blue-100 transition-colors"
          >
            <h3 className="font-semibold text-blue-800">Training Records</h3>
            <p className="text-sm text-blue-600 mt-1">
              View training executions and certifications
            </p>
          </Link>
          <Link
            href="/compliance/reports"
            className="rounded-xl border border-purple-100 bg-purple-50 p-5 hover:bg-purple-100 transition-colors"
          >
            <h3 className="font-semibold text-purple-800">Compliance Reports</h3>
            <p className="text-sm text-purple-600 mt-1">Analytics and audit preparation reports</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
