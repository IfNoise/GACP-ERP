import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CreateStrainForm } from './_components/create-strain-form';

export default async function NewStrainPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">
        <CreateStrainForm />
      </div>
    </div>
  );
}
