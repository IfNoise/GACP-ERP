import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CreateCAPAForm } from './_components/create-capa-form';

export default async function NewCAPAPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <CreateCAPAForm />
      </div>
    </div>
  );
}
