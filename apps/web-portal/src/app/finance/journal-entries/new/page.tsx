import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CreateJournalEntryForm } from './_components/create-journal-entry-form';

export default async function NewJournalEntryPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <CreateJournalEntryForm />
      </div>
    </div>
  );
}
