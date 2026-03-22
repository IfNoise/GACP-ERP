import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ValidationProtocolList } from './_components/validation-protocol-list';

export default async function ValidationProtocolsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <ValidationProtocolList />
      </div>
    </div>
  );
}
