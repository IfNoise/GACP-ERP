import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TrainingExecutionDetail } from './_components/training-execution-detail';

export default async function ExecutionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id } = await params;

  return (
    <div className="container mx-auto max-w-5xl p-6">
      <TrainingExecutionDetail id={id} />
    </div>
  );
}
