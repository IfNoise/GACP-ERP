import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { CreateSupplierForm } from './_components/create-supplier-form';

export default async function NewSupplierPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="mx-auto max-w-2xl py-8 px-4">
      <CreateSupplierForm />
    </div>
  );
}
