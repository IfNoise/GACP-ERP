import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { CreateAccountForm } from './_components/create-account-form';

export default async function NewAccountPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="mx-auto max-w-2xl py-8 px-4">
      <CreateAccountForm />
    </div>
  );
}
