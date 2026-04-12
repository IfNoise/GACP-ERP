import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { IntakeWizard } from './_components/intake-wizard';

export const metadata = { title: 'Intake Wizard — GACP-ERP' };

export default async function IntakePage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Intake Wizard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Register a new batch and assign plants to a cultivation zone.
          </p>
        </div>
        <IntakeWizard />
      </div>
    </div>
  );
}
