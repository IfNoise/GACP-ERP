import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { TrainingExecutionsTable, CertificationsTable } from './_components/training-tables';

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
          <div className="p-4">
            <TrainingExecutionsTable data={executions?.data ?? []} />
          </div>
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
          <div className="p-4">
            <CertificationsTable data={certifications?.data ?? []} />
          </div>
        </div>
      </div>
    </main>
  );
}
