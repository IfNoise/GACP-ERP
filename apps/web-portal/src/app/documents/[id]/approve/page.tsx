import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { DocumentApprove } from './_components/document-approve';

export default async function DocumentApprovePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect('/login');
  const { id } = await params;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">
        <DocumentApprove id={id} />
      </div>
    </div>
  );
}
