import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { StageTransitionForm } from './_components/stage-transition-form';

interface TransitionPageProps {
  params: Promise<{ id: string }>;
}

export default async function TransitionPage({ params }: TransitionPageProps) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id } = await params;
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl">
        <StageTransitionForm plantId={id} />
      </div>
    </div>
  );
}
