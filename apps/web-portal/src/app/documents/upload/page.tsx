import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { DocumentUploadForm } from './_components/document-upload-form';

export default async function DocumentUploadPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">
        <DocumentUploadForm />
      </div>
    </div>
  );
}
