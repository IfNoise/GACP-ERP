import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CreateEmployeeForm } from './_components/create-employee-form';

export default async function NewEmployeePage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl">
        <CreateEmployeeForm />
      </div>
    </div>
  );
}
