import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { QualityEventDetail } from './_components/quality-event-detail';

export default async function QualityEventDetailPage({
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
        <QualityEventDetail id={id} />
      </div>
    </div>
  );
}
