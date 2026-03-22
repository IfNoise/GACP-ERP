import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CreatePlantForm } from './_components/create-plant-form';

export default async function NewPlantPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl">
        <CreatePlantForm />
      </div>
    </div>
  );
}
