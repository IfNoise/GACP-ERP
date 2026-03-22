import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AuditTrailExport } from './_components/audit-trail-export';

export default async function AuditTrailPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <AuditTrailExport />
      </div>
    </div>
  );
}
