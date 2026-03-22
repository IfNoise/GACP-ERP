import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AnalyticsOverview } from './_components/analytics-overview';

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <AnalyticsOverview />
      </div>
    </div>
  );
}
