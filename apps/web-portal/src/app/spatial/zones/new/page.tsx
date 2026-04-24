import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CreateZoneForm } from './_components/create-zone-form';

export default async function NewZonePage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <CreateZoneForm />
      </div>
    </div>
  );
}
