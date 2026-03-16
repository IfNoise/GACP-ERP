import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import type { AlertThreshold } from '@gacp-erp/shared-schemas';
import { ZoneReadingsPanel } from '../_components/zone-readings-panel';
import { ZoneTimeSeriesChart } from '../_components/zone-time-series-chart';
import { ThresholdManager } from '../_components/threshold-manager';

interface Zone {
  id: string;
  zone_code: string;
  name: string;
  zone_type: string;
  is_active: boolean;
  description?: string;
}

async function fetchZone(zoneId: string, accessToken: string): Promise<Zone | null> {
  const base = process.env['API_GATEWAY_URL'] ?? 'http://localhost:3000/api/v1';
  try {
    const res = await fetch(`${base}/zones/${zoneId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      next: { revalidate: 60 },
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json() as Promise<Zone>;
  } catch {
    return null;
  }
}

async function fetchThresholds(zoneId: string, accessToken: string): Promise<AlertThreshold[]> {
  const base = process.env['API_GATEWAY_URL'] ?? 'http://localhost:3000/api/v1';
  try {
    const res = await fetch(`${base}/iot/thresholds?zone_id=${zoneId}&is_active=true`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      next: { revalidate: 30 },
    });
    if (!res.ok) return [];
    return res.json() as Promise<AlertThreshold[]>;
  } catch {
    return [];
  }
}

interface ZoneDetailPageProps {
  params: Promise<{ zoneId: string }>;
}

export default async function ZoneDetailPage({ params }: ZoneDetailPageProps) {
  const { zoneId } = await params;

  const session = await auth();
  if (!session) redirect('/login');

  const accessToken = (session as { accessToken?: string }).accessToken ?? '';
  const roles: string[] = (session as { roles?: string[] }).roles ?? [];
  const canManage = roles.includes('QUALITY_MANAGER') || roles.includes('SUPER_ADMIN');

  const [zone, thresholds] = await Promise.all([
    fetchZone(zoneId, accessToken),
    fetchThresholds(zoneId, accessToken),
  ]);

  if (!zone) notFound();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/iot" className="hover:text-blue-600">
            IoT Monitoring
          </Link>
          <span>/</span>
          <span className="font-medium text-gray-800">{zone.name}</span>
        </nav>

        {/* Zone Header */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{zone.name}</h1>
              <div className="mt-1 flex items-center gap-3">
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  {zone.zone_type}
                </span>
                <span className="text-sm text-gray-500">{zone.zone_code}</span>
                {zone.is_active ? (
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    Active
                  </span>
                ) : (
                  <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                    Inactive
                  </span>
                )}
              </div>
              {zone.description && <p className="mt-2 text-sm text-gray-600">{zone.description}</p>}
            </div>
            <Link
              href={`/iot/alerts?zone_id=${zoneId}`}
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
            >
              Alert History
            </Link>
          </div>
        </div>

        {/* Live Readings */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Live Sensor Readings</h2>
          <ZoneReadingsPanel zoneId={zoneId} thresholds={thresholds} />
        </div>

        {/* Time Series Chart */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Historical Trends</h2>
          <ZoneTimeSeriesChart zoneId={zoneId} />
        </div>

        {/* Alert Thresholds */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Alert Thresholds</h2>
          <ThresholdManager zoneId={zoneId} canManage={canManage} />
        </div>
      </div>
    </div>
  );
}
