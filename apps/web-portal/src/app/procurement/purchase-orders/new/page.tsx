import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CreatePurchaseOrderForm } from './_components/create-purchase-order-form';

export default async function NewPurchaseOrderPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <CreatePurchaseOrderForm />
      </div>
    </div>
  );
}
