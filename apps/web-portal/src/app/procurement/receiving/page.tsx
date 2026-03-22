import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ReceivingForm } from './_components/receiving-form';

export default async function ReceivingPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <ReceivingForm />
      </div>
    </div>
  );
}
