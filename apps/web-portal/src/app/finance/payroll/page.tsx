import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PayrollPlaceholder } from './_components/payroll-placeholder';

export default async function PayrollPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <PayrollPlaceholder />
      </div>
    </div>
  );
}
