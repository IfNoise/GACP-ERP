import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { HarvestForm } from './_components/harvest-form';

interface HarvestPageProps {
  params: Promise<{ id: string }>;
}

export default async function HarvestPage({ params }: HarvestPageProps) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id } = await params;
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl">
        <HarvestForm batchId={id} />
      </div>
    </div>
  );
}
