import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

interface BatchItem {
  status: string;
}

interface PlantsResponse {
  total: number;
}

interface DashboardStats {
  activeBatches: number;
  totalPlants: number;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const base = process.env['CULTIVATION_SERVICE_URL'] ?? 'http://localhost:3002/internal';
  try {
    const [batchesRes, plantsRes] = await Promise.all([
      fetch(`${base}/batches`, { next: { revalidate: 30 } }),
      fetch(`${base}/plants?limit=1`, { next: { revalidate: 30 } }),
    ]);

    const batches = batchesRes.ok ? ((await batchesRes.json()) as BatchItem[]) : [];
    const plantsData = plantsRes.ok ? ((await plantsRes.json()) as PlantsResponse) : { total: 0 };

    const activeBatches = batches.filter(
      (b) => b.status === 'active' || b.status === 'in_progress',
    ).length;

    return { activeBatches, totalPlants: plantsData.total };
  } catch {
    return { activeBatches: 0, totalPlants: 0 };
  }
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const stats = await fetchDashboardStats();

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Overview of your GACP-ERP operations</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Active Batches"
          value={String(stats.activeBatches)}
          description="Cannabis batches in cultivation"
          href="/batches"
        />
        <DashboardCard
          title="Total Plants"
          value={String(stats.totalPlants)}
          description="Plants across all active batches"
          href="/plants"
        />
        <DashboardCard
          title="Pending QC"
          value="—"
          description="Harvests awaiting quality review"
          href="/quality/change-controls"
        />
        <DashboardCard
          title="Open Deviations"
          value="—"
          description="Unresolved CAPA items"
          href="/quality/capas"
        />
      </div>
    </div>
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
