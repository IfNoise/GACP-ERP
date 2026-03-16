import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { LogoutButton } from '@/components/auth/logout-button';

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
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">GACP-ERP Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Welcome, {session.user?.name ?? session.user?.email}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(session.roles ?? []).map((role) => (
                <Badge key={role} variant="success">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
          <LogoutButton />
        </header>

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
            href="/quality"
          />
          <DashboardCard
            title="Open Deviations"
            value="—"
            description="Unresolved CAPA items"
            href="/capa"
          />
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
