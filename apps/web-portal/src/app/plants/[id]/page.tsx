import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PlantDetail } from './_components/plant-detail';

interface PlantPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlantPage({ params }: PlantPageProps) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id } = await params;
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <PlantDetail id={id} />
      </div>
    </div>
  );
}
