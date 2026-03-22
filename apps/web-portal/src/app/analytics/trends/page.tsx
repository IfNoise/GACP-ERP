import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { TrendsDashboard } from './_components/trends-dashboard';

export default async function TrendsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <TrendsDashboard />
      </div>
    </div>
  );
}
