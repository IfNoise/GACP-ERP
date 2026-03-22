import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CreateChangeControlForm } from './_components/create-change-control-form';

export default async function NewChangeControlPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <CreateChangeControlForm />
      </div>
    </div>
  );
}
