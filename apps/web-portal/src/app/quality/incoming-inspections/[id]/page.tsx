import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { IncomingInspectionDetail } from './_components/incoming-inspection-detail';

export default async function IncomingInspectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id } = await params;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <IncomingInspectionDetail id={id} />
      </div>
    </div>
  );
}
