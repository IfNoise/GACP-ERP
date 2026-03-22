import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { BatchDetail } from './_components/batch-detail';

interface BatchPageProps {
  params: Promise<{ id: string }>;
}

export default async function BatchPage({ params }: BatchPageProps) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id } = await params;
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <BatchDetail id={id} />
      </div>
    </div>
  );
}
