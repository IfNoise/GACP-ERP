import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { QualityEventList } from './_components/quality-event-list';

export default async function QualityEventsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <QualityEventList />
      </div>
    </div>
  );
}
