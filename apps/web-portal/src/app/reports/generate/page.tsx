import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ReportGenerateForm } from './_components/report-generate-form';

export default async function ReportGeneratePage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">
        <ReportGenerateForm />
      </div>
    </div>
  );
}
