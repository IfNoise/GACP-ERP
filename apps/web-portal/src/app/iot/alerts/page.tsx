import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';

interface AlertHistoryItem {
  id: string;
  zone_id: string;
  sensor_type: string;
  triggered_value: number;
  alert_level: 'WARNING' | 'CRITICAL';
  triggered_at: string;
  acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
}

interface PaginatedAlerts {
  data: AlertHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AlertsPageProps {
  searchParams: Promise<{
    zone_id?: string;
    alert_level?: string;
    acknowledged?: string;
    page?: string;
  }>;
}

async function fetchAlerts(
  accessToken: string,
  params: { zone_id?: string; alert_level?: string; acknowledged?: string; page?: string },
): Promise<PaginatedAlerts> {
  const base = process.env['API_GATEWAY_URL'] ?? 'http://localhost:3000/api/v1';
  const qs = new URLSearchParams();
  if (params.zone_id) qs.set('zone_id', params.zone_id);
  if (params.alert_level) qs.set('alert_level', params.alert_level);
  if (params.acknowledged !== undefined) qs.set('acknowledged', params.acknowledged);
  qs.set('page', params.page ?? '1');
  qs.set('limit', '20');

  try {
    const res = await fetch(`${base}/iot/alerts?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (!res.ok) return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    return res.json() as Promise<PaginatedAlerts>;
  } catch {
    return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
  }
}

const LEVEL_STYLE: Record<string, string> = {
  WARNING: 'bg-yellow-100 text-yellow-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

export default async function AlertHistoryPage({ searchParams }: AlertsPageProps) {
  const params = await searchParams;

  const session = await auth();
  if (!session) redirect('/login');

  const accessToken = (session as { accessToken?: string }).accessToken ?? '';

  const result = await fetchAlerts(accessToken, params);
  const currentPage = result.page;

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const merged = { ...params, ...overrides };
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined && v !== '') qs.set(k, v);
    }
    return `/iot/alerts?${qs.toString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/iot" className="hover:text-blue-600">
            IoT Monitoring
          </Link>
          <span>/</span>
          <span className="font-medium text-gray-800">Alert History</span>
        </nav>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Alert History</h1>
          <span className="text-sm text-gray-500">{result.total} total alerts</span>
        </div>

        {/* Filters */}
        <form
          method="GET"
          className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow-sm"
        >
          <div>
            <label className="block text-xs text-gray-500">Alert Level</label>
            <select
              name="alert_level"
              defaultValue={params.alert_level ?? ''}
              className="mt-1 rounded border px-2 py-1.5 text-sm"
            >
              <option value="">All</option>
              <option value="WARNING">WARNING</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500">Acknowledged</label>
            <select
              name="acknowledged"
              defaultValue={params.acknowledged ?? ''}
              className="mt-1 rounded border px-2 py-1.5 text-sm"
            >
              <option value="">All</option>
              <option value="false">Unacknowledged</option>
              <option value="true">Acknowledged</option>
            </select>
          </div>
          {params.zone_id && <input type="hidden" name="zone_id" value={params.zone_id} />}
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Apply
          </button>
          <Link
            href="/iot/alerts"
            className="rounded-md px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Clear
          </Link>
        </form>

        {/* Table */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          {result.data.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No alerts found matching the filters.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                  <th className="px-4 py-3">Triggered At</th>
                  <th className="px-4 py-3">Zone</th>
                  <th className="px-4 py-3">Sensor</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Level</th>
                  <th className="px-4 py-3">Acknowledged</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {result.data.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {new Date(alert.triggered_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/iot/${alert.zone_id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {alert.zone_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {alert.sensor_type.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3 font-mono">{alert.triggered_value}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${LEVEL_STYLE[alert.alert_level]}`}
                      >
                        {alert.alert_level}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {alert.acknowledged ? (
                        <span className="text-green-600">✓ {alert.acknowledged_by}</span>
                      ) : (
                        <span className="text-gray-400">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {result.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <span className="text-sm text-gray-500">
                Page {currentPage} of {result.totalPages}
              </span>
              <div className="flex gap-2">
                {currentPage > 1 && (
                  <Link
                    href={buildHref({ page: String(currentPage - 1) })}
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
                  >
                    Previous
                  </Link>
                )}
                {currentPage < result.totalPages && (
                  <Link
                    href={buildHref({ page: String(currentPage + 1) })}
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
