import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { DocumentDetail } from './_components/document-detail';

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect('/login');
  const { id } = await params;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <DocumentDetail id={id} />
      </div>
    </div>
  );
}
