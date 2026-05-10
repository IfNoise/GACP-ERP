'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  useZones,
  useZoneReadings,
  useIotAlerts,
  useSpatialBuildings,
  useUpdateZoneBounds,
} from '@/hooks';
import { FacilityViewer, ZoneHighlighter, SensorOverlay } from '@gacp-erp/ui-components/xeokit';
import { StatusBadge, KPICard, Button } from '@gacp-erp/ui-components';
import type {
  FacilityViewerHandle,
  ZoneEntity,
  SensorReading,
} from '@gacp-erp/ui-components/xeokit';
import type { StatusVariant } from '@gacp-erp/ui-components';

const ZONE_TYPE_VARIANT: Record<string, StatusVariant> = {
  CULTIVATION: 'active',
  PROCESSING: 'pending',
  STORAGE: 'overdue',
  UTILITY: 'draft',
  OFFICE: 'draft',
  QUARANTINE: 'rejected',
};

interface BuildingRecord {
  id: string;
  building_name: string;
  building_code: string;
  model_url: string | null;
  model_format: string | null;
}

interface ZoneAssignBoundsModalProps {
  bounds: [number, number, number, number, number, number];
  zones: ZoneEntity[];
  onConfirm: (zoneId: string) => void;
  onClose: () => void;
  isPending: boolean;
}

function ZoneAssignBoundsModal({
  bounds,
  zones,
  onConfirm,
  onClose,
  isPending,
}: ZoneAssignBoundsModalProps) {
  const [selectedZoneId, setSelectedZoneId] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-96 rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="mb-4 text-base font-semibold text-gray-900">Assign Bounds to Zone</h2>

        <p className="mb-3 text-xs text-gray-500">
          Bounds: [{bounds.map((v) => v.toFixed(2)).join(', ')}]
        </p>

        <label className="mb-1 block text-xs font-medium text-gray-700">Select zone</label>
        <select
          className="mb-4 w-full rounded border px-3 py-2 text-sm"
          value={selectedZoneId}
          onChange={(e) => setSelectedZoneId(e.target.value)}
        >
          <option value="">— choose a zone —</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.zone_code} — {z.zone_name}
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!selectedZoneId || isPending}
            onClick={() => selectedZoneId && onConfirm(selectedZoneId)}
          >
            {isPending ? 'Saving…' : 'Assign'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Facility3DViewer() {
  const router = useRouter();
  const viewerRef = useRef<FacilityViewerHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedZoneId, setSelectedZoneId] = useState<string | undefined>();
  const [hoveredZone, setHoveredZone] = useState<ZoneEntity | null>(null);
  const [showLabels, setShowLabels] = useState(true);

  // Building model state
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [editMode, setEditMode] = useState(false);
  const [pendingBounds, setPendingBounds] = useState<
    [number, number, number, number, number, number] | null
  >(null);

  // Fetch zones
  const { data: zonesData, isLoading } = useZones({ limit: 100 });
  const zones = ((zonesData as Record<string, unknown>)?.['data'] ?? []) as Record<
    string,
    unknown
  >[];

  // Fetch buildings from spatial-service
  const { data: buildingsRaw } = useSpatialBuildings();
  const buildings = (buildingsRaw as BuildingRecord[] | undefined) ?? [];

  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId) ?? null;

  // Fetch sensor readings for selected zone
  const { data: sensorData } = useZoneReadings(selectedZoneId ?? '');

  // Fetch active alerts
  const { data: alertsData } = useIotAlerts({ acknowledged: 'false' });

  const updateZoneBounds = useUpdateZoneBounds();

  // Map zones to ZoneEntity for 3D viewer — use real bounds_3d if available
  const zoneEntities: ZoneEntity[] = useMemo(
    () =>
      zones.map((z, idx) => ({
        id: String(z['id']),
        zone_code: String(z['zone_code'] ?? ''),
        zone_name: String(z['zone_name'] ?? ''),
        zone_type: String(z['zone_type'] ?? 'UTILITY'),
        ...(z['current_occupancy'] != null && z['capacity'] != null && Number(z['capacity']) > 0
          ? { occupancy: Number(z['current_occupancy']) / Number(z['capacity']) }
          : {}),
        is_active: z['is_active'] !== false,
        // Use real 3D bounds if available, otherwise auto-layout grid
        bounds: Array.isArray(z['bounds_3d'])
          ? (z['bounds_3d'] as [number, number, number, number, number, number])
          : ([(idx % 5) * 8, 0, Math.floor(idx / 5) * 8, 6, 3, 6] as [
              number,
              number,
              number,
              number,
              number,
              number,
            ]),
      })),
    [zones],
  );

  // Map sensor data for the overlay
  const sensorOverlayData: Record<string, SensorReading[]> = useMemo(() => {
    if (!sensorData || !selectedZoneId) return {};
    const readings = ((sensorData as Record<string, unknown>)['readings'] ?? []) as Record<
      string,
      unknown
    >[];
    return {
      [selectedZoneId]: readings.map((r) => ({
        sensor_type: String(r['sensor_type']),
        value: Number(r['value']),
        ...(r['unit'] ? { unit: String(r['unit']) } : {}),
        timestamp: Number(r['timestamp']),
      })),
    };
  }, [sensorData, selectedZoneId]);

  // Map alerts by zone
  const alertsByZone: Record<string, string> = useMemo(() => {
    const alerts = ((alertsData as Record<string, unknown>)?.['data'] ?? []) as Record<
      string,
      unknown
    >[];
    const map: Record<string, string> = {};
    for (const a of alerts) {
      const zid = String(a['zone_id'] ?? '');
      if (zid) map[zid] = String(a['message'] ?? 'Alert');
    }
    return map;
  }, [alertsData]);

  const handleZoneClick = useCallback((zone: ZoneEntity) => {
    setSelectedZoneId(zone.id);
  }, []);

  const handleZoneHover = useCallback((zone: ZoneEntity | null) => {
    setHoveredZone(zone);
  }, []);

  const handleNavigateToZone = useCallback(() => {
    if (selectedZoneId) {
      router.push(`/spatial/zones/${selectedZoneId}`);
    }
  }, [selectedZoneId, router]);

  const handleBoundsCreated = useCallback(
    (bounds: [number, number, number, number, number, number]) => {
      setPendingBounds(bounds);
    },
    [],
  );

  const handleAssignBounds = useCallback(
    (zoneId: string) => {
      if (!pendingBounds) return;
      updateZoneBounds.mutate(
        { id: zoneId, bounds_3d: pendingBounds },
        {
          onSuccess: () => {
            setPendingBounds(null);
            setEditMode(false);
          },
        },
      );
    },
    [pendingBounds, updateZoneBounds],
  );

  const selectedZone = zoneEntities.find((z) => z.id === selectedZoneId);

  // Summary KPIs
  const totalZones = zoneEntities.length;
  const activeZones = zoneEntities.filter((z) => z.is_active).length;
  const alertCount = Object.keys(alertsByZone).length;
  const avgOccupancy =
    zoneEntities.length > 0
      ? zoneEntities.reduce((acc, z) => acc + (z.occupancy ?? 0), 0) / zoneEntities.length
      : 0;

  return (
    <div className="flex h-full flex-col" ref={containerRef}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-white px-4 py-2">
        <div>
          <h1 className="text-lg font-bold text-gray-900">3D Facility Viewer</h1>
          <p className="text-xs text-gray-500">Interactive visualization of all zones</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Building model selector */}
          {buildings.length > 0 && (
            <select
              className="rounded border px-2 py-1 text-xs"
              value={selectedBuildingId}
              onChange={(e) => {
                setSelectedBuildingId(e.target.value);
                setEditMode(false);
                setPendingBounds(null);
              }}
            >
              <option value="">No building model</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id} disabled={!b.model_url}>
                  {b.building_code} — {b.building_name}
                  {!b.model_url ? ' (no model)' : ''}
                </option>
              ))}
            </select>
          )}

          {/* Mark zone button (only when a model with URL is selected) */}
          {selectedBuilding?.model_url && (
            <Button
              variant={editMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setEditMode((v) => !v);
                setPendingBounds(null);
              }}
            >
              {editMode ? 'Stop Marking' : 'Mark Zone'}
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={() => viewerRef.current?.resetView()}>
            Reset View
          </Button>
          <label className="flex items-center gap-1 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
            />
            Labels
          </label>
          {selectedZoneId && (
            <Button size="sm" onClick={handleNavigateToZone}>
              Go to Zone Detail →
            </Button>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-3 border-b bg-gray-50 px-4 py-2">
        <KPICard title="Total Zones" value={String(totalZones)} />
        <KPICard title="Active" value={String(activeZones)} />
        <KPICard title="Alerts" value={String(alertCount)} />
        <KPICard title="Avg Occupancy" value={`${Math.round(avgOccupancy * 100)}%`} />
      </div>

      {/* Main viewer area */}
      <div className="relative flex-1">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <span className="animate-pulse text-gray-500">Loading zone data...</span>
          </div>
        ) : (
          <>
            <FacilityViewer
              ref={viewerRef}
              zones={zoneEntities}
              sensorData={sensorOverlayData}
              onZoneClick={handleZoneClick}
              onZoneHover={handleZoneHover}
              selectedZoneId={selectedZoneId}
              showLabels={showLabels}
              modelUrl={selectedBuilding?.model_url ?? undefined}
              modelFormat={
                (selectedBuilding?.model_format as 'ifc' | 'gltf' | 'xkt' | undefined) ?? undefined
              }
              editMode={editMode}
              onBoundsCreated={handleBoundsCreated}
            />

            <ZoneHighlighter
              hoveredZone={hoveredZone}
              alertsByZone={alertsByZone}
              containerRef={containerRef}
            />

            <SensorOverlay sensorData={sensorOverlayData} selectedZoneId={selectedZoneId} />
          </>
        )}

        {/* Selected zone sidebar */}
        {selectedZone && (
          <div className="absolute right-3 top-3 z-20 w-64 rounded-lg bg-white/95 p-4 shadow-lg backdrop-blur">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{selectedZone.zone_name}</h3>
              <Button variant="ghost" onClick={() => setSelectedZoneId(undefined)}>
                ✕
              </Button>
            </div>
            <p className="text-xs text-gray-500">{selectedZone.zone_code}</p>
            <div className="mt-2">
              <StatusBadge
                status={ZONE_TYPE_VARIANT[selectedZone.zone_type] ?? 'draft'}
                label={selectedZone.zone_type}
              />
            </div>
            {selectedZone.occupancy != null && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Occupancy</span>
                  <span>{Math.round(selectedZone.occupancy * 100)}%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-green-500 transition-all"
                    style={{ width: `${Math.min(selectedZone.occupancy * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
            {alertsByZone[selectedZone.id] && (
              <p className="mt-3 text-xs font-medium text-red-600">
                ⚠ {alertsByZone[selectedZone.id]}
              </p>
            )}
            <Button className="mt-4 w-full" size="sm" onClick={handleNavigateToZone}>
              View Zone Detail
            </Button>
          </div>
        )}
      </div>

      {/* Zone bounds assignment modal */}
      {pendingBounds && (
        <ZoneAssignBoundsModal
          bounds={pendingBounds}
          zones={zoneEntities}
          onConfirm={handleAssignBounds}
          onClose={() => setPendingBounds(null)}
          isPending={updateZoneBounds.isPending}
        />
      )}
    </div>
  );
}
