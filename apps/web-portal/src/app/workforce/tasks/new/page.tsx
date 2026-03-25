import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CreateTaskForm } from './_components/create-task-form';

export default async function NewTaskPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl">
        <CreateTaskForm />
      </div>
    </div>
  );
}
