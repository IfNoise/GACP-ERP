import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { DocumentList } from './_components/document-list';

export default async function DocumentsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <DocumentList />
      </div>
    </div>
  );
}
