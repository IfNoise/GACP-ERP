import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { BiologicalAssetDashboard } from './_components/biological-asset-dashboard';

export default async function BiologicalAssetsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <BiologicalAssetDashboard />
      </div>
    </div>
  );
}
