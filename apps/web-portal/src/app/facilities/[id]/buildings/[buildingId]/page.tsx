import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { BuildingDetail } from './_components/building-detail';

export default async function BuildingPage({
  params,
}: {
  params: Promise<{ id: string; buildingId: string }>;
}) {
  const session = await auth();
  if (!session) redirect('/login');
  const { id: facilityId, buildingId } = await params;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <BuildingDetail facilityId={facilityId} buildingId={buildingId} />
      </div>
    </div>
  );
}
