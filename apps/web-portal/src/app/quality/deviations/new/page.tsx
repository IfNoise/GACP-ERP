import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ReportDeviationForm } from './_components/report-deviation-form';

export default async function NewDeviationPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <ReportDeviationForm />
      </div>
    </div>
  );
}
