import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Facility3DViewer } from './_components/facility-3d-viewer';

export default async function Spatial3DPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="h-[calc(100vh-4rem)]">
      <Facility3DViewer />
    </div>
  );
}
