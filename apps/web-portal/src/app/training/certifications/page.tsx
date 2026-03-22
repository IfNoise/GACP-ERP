import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CertificationMatrix } from './_components/certification-matrix';

export default async function CertificationsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <CertificationMatrix />
    </div>
  );
}
