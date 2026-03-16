import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { AlertThreshold } from '@gacp-erp/shared-schemas';
import { ZoneReadingsPanel } from './_components/zone-readings-panel';

interface Zone {
  id: string;
  zone_code: string;
  name: string;
  zone_type: string;
  is_active: boolean;
}

async function fetchZones(accessToken: string): Promise<Zone[]> {
  const base = process.env['API_GATEWAY_URL'] ?? 'http://localhost:3000/api/v1';
  try {
    const res = await fetch(`${base}/zones`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: Zone[] } | Zone[];
    return Array.isArray(json) ? json : (json.data ?? []);
  } catch {
    return [];
  }
}

async function fetchThresholds(accessToken: string): Promise<AlertThreshold[]> {
  const base = process.env['API_GATEWAY_URL'] ?? 'http://localhost:3000/api/v1';
  try {
    const res = await fetch(`${base}/iot/thresholds?is_active=true`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      next: { revalidate: 30 },
    });
    if (!res.ok) return [];
    return res.json() as Promise<AlertThreshold[]>;
  } catch {
    return [];
  }
}

export default async function IotDashboardPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const accessToken = (session as { accessToken?: string }).accessToken ?? '';

  const [zones, thresholds] = await Promise.all([
    fetchZones(accessToken),
    fetchThresholds(accessToken),
  ]);

  const activeZones = zones.filter((z) => z.is_active);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">IoT Environmental Monitoring</h1>
            <p className="mt-1 text-sm text-gray-500">
              Real-time sensor data from all active cultivation zones
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/iot/alerts"
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
            >
              Alert History
            </Link>
          </div>
        </div>

        {activeZones.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow-sm">
            <p className="text-gray-500">
              No active zones found. Create zones in the Facilities module.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {activeZones.map((zone) => (
              <div key={zone.id} className="rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      {zone.name}
                      <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {zone.zone_type}
                      </span>
                    </h2>
                    <p className="text-sm text-gray-500">{zone.zone_code}</p>
                  </div>
                  <Link
                    href={`/iot/${zone.id}`}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    View Details →
                  </Link>
                </div>

                <ZoneReadingsPanel
                  zoneId={zone.id}
                  thresholds={thresholds.filter((t) => (t.zone_id as string) === zone.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
