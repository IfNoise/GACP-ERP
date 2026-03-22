import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SupplierList } from './_components/supplier-list';

export default async function SuppliersPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <SupplierList />
      </div>
    </div>
  );
}
