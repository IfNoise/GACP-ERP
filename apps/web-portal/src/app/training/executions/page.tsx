import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TrainingExecutionList } from './_components/training-execution-list';

export default async function ExecutionsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <TrainingExecutionList />
    </div>
  );
}
