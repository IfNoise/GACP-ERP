import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TaskBoard } from './_components/task-board';

export default async function TasksPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <TaskBoard />
      </div>
    </div>
  );
}
