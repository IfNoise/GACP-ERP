import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { RCAForm } from './_components/rca-form';

export default async function RCAPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect('/login');
  const { id } = await params;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <RCAForm id={id} />
      </div>
    </div>
  );
}
