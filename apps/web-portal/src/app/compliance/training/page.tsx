import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

interface TrainingExecution {
  id: string;
  course_id: string;
  trainee_id: string;
  status: string;
  score: number | null;
  completed_at: string | null;
  created_at: string;
}

interface Certification {
  id: string;
  employee_id: string;
  course_id: string;
  issued_at: string;
  valid_until: string;
  certificate_number: string;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

async function fetchTrainingExecutions(): Promise<PaginatedResult<TrainingExecution> | null> {
  const base = process.env['WORKFORCE_SERVICE_URL'] ?? 'http://localhost:3005/internal';
  try {
    const res = await fetch(`${base}/v1/workforce/training?limit=20`, { next: { revalidate: 30 } });
    if (!res.ok) return null;
    return res.json() as Promise<PaginatedResult<TrainingExecution>>;
  } catch {
    return null;
  }
}

async function fetchCertifications(): Promise<PaginatedResult<Certification> | null> {
  const base = process.env['WORKFORCE_SERVICE_URL'] ?? 'http://localhost:3005/internal';
  try {
    const res = await fetch(`${base}/v1/workforce/certifications?limit=20`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    return res.json() as Promise<PaginatedResult<Certification>>;
  } catch {
    return null;
  }
}

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  SCHEDULED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  EXPIRED: 'bg-gray-100 text-gray-600',
};

export default async function TrainingCompliancePage() {
  const session = await auth();
  if (!session) redirect('/login');

  const [executions, certifications] = await Promise.all([
    fetchTrainingExecutions(),
    fetchCertifications(),
  ]);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Training Records</h1>
            <p className="text-sm text-gray-500 mt-1">
              Training executions and certifications — EU GMP Annex 11 §2
            </p>
          </div>
          <Link href="/compliance" className="text-sm text-blue-600 hover:underline">
            ← Compliance Dashboard
          </Link>
        </div>

        {/* Training Executions */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="font-semibold text-gray-800">
              Training Executions
              {executions && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({executions.total} total)
                </span>
              )}
            </h2>
          </div>
          {!executions || executions.data.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400">No training records found</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Trainee ID</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Course ID</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Score</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {executions.data.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono text-xs text-gray-600">
                      {e.trainee_id.slice(0, 8)}…
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-gray-600">
                      {e.course_id.slice(0, 8)}…
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[e.status] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="px-6 py-3">{e.score !== null ? `${e.score}%` : '—'}</td>
                    <td className="px-6 py-3 text-gray-500">
                      {e.completed_at ? new Date(e.completed_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Certifications */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="font-semibold text-gray-800">
              Certifications
              {certifications && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({certifications.total} total)
                </span>
              )}
            </h2>
          </div>
          {!certifications || certifications.data.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400">No certifications found</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Certificate #</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Employee ID</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Issued</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Valid Until</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {certifications.data.map((cert) => {
                  const expired = new Date(cert.valid_until) < new Date();
                  return (
                    <tr key={cert.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-mono text-xs">{cert.certificate_number}</td>
                      <td className="px-6 py-3 font-mono text-xs text-gray-600">
                        {cert.employee_id.slice(0, 8)}…
                      </td>
                      <td className="px-6 py-3 text-gray-500">
                        {new Date(cert.issued_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-gray-500">
                        {new Date(cert.valid_until).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${expired ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                        >
                          {expired ? 'EXPIRED' : 'VALID'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
