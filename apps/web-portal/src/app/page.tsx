import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">GACP-ERP Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome, {session.user?.name ?? session.user?.email}</p>
        </header>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            title="Active Batches"
            value="—"
            description="Cannabis batches in cultivation"
            href="/batches"
          />
          <DashboardCard
            title="Total Plants"
            value="—"
            description="Plants across all active batches"
            href="/plants"
          />
          <DashboardCard
            title="Pending QC"
            value="—"
            description="Harvests awaiting quality review"
            href="/quality"
          />
          <DashboardCard
            title="Open Deviations"
            value="—"
            description="Unresolved CAPA items"
            href="/capa"
          />
        </div>

        <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            🚧 System under development — EPIC 2 in progress. Data will appear after
            cultivation-service is connected.
          </p>
        </div>
      </div>
    </main>
  );
}

interface DashboardCardProps {
  readonly title: string;
  readonly value: string;
  readonly description: string;
  readonly href: string;
}

function DashboardCard({ title, value, description, href }: DashboardCardProps) {
  return (
    <a
      href={href}
      className="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm
                 transition hover:shadow-md"
    >
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-600">{description}</p>
    </a>
  );
}
