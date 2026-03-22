import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { EmployeeDetail } from './_components/employee-detail';

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect('/login');
  const { id } = await params;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <EmployeeDetail id={id} />
      </div>
    </div>
  );
}
