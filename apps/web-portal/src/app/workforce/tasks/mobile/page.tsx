import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { MobileTaskList } from './_components/mobile-task-list';

export default async function MobileTasksPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <MobileTaskList />
    </div>
  );
}
