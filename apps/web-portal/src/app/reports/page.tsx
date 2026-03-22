import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ReportCatalog } from './_components/report-catalog';

export default async function ReportsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <ReportCatalog />
      </div>
    </div>
  );
}
