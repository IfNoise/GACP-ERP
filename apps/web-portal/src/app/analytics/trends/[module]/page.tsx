import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ModuleTrend } from './_components/module-trend';

export default async function ModuleTrendPage({ params }: { params: Promise<{ module: string }> }) {
  const session = await auth();
  if (!session) redirect('/login');
  const { module: mod } = await params;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <ModuleTrend module={mod.toUpperCase()} />
      </div>
    </div>
  );
}
