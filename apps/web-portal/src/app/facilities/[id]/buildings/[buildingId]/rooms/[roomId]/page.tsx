import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { RoomDetail } from './_components/room-detail';

export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string; buildingId: string; roomId: string }>;
}) {
  const session = await auth();
  if (!session) redirect('/login');
  const { id: facilityId, buildingId, roomId } = await params;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <RoomDetail facilityId={facilityId} buildingId={buildingId} roomId={roomId} />
      </div>
    </div>
  );
}
