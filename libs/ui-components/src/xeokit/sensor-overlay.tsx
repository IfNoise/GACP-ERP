'use client';

import type { SensorReading } from './facility-viewer';

export interface SensorOverlayProps {
  /** Sensor readings keyed by zone id */
  sensorData: Record<string, SensorReading[]>;
  /** Currently selected zone to expand */
  selectedZoneId?: string | undefined;
  /** CSS class */
  className?: string | undefined;
}

const SENSOR_ICON: Record<string, string> = {
  temperature: '🌡️',
  humidity: '💧',
  co2: '🫧',
  light: '☀️',
  ph: '⚗️',
  airflow: '💨',
};

const SENSOR_THRESHOLDS: Record<string, { warn: number; critical: number }> = {
  temperature: { warn: 30, critical: 35 },
  humidity: { warn: 80, critical: 90 },
  co2: { warn: 1200, critical: 1500 },
  light: { warn: 40000, critical: 60000 },
};

function getThresholdColor(type: string, value: number): string {
  const t = SENSOR_THRESHOLDS[type];
  if (!t) return 'text-green-600';
  if (value >= t.critical) return 'text-red-600';
  if (value >= t.warn) return 'text-yellow-600';
  return 'text-green-600';
}

/**
 * SensorOverlay — floating badges that display current sensor values
 * above the 3D viewer. Shows condensed summary for all zones, expanded
 * detail for the selected zone.
 */
export function SensorOverlay({ sensorData, selectedZoneId, className }: SensorOverlayProps) {
  // Show selected zone's sensors in expanded form
  const selectedReadings = selectedZoneId ? (sensorData[selectedZoneId] ?? []) : [];

  // Compute aggregate alerts across all zones
  const alerts: { zoneId: string; type: string; value: number; unit: string }[] = [];
  for (const [zoneId, readings] of Object.entries(sensorData)) {
    for (const r of readings) {
      const t = SENSOR_THRESHOLDS[r.sensor_type];
      if (t && r.value >= t.warn) {
        alerts.push({ zoneId, type: r.sensor_type, value: r.value, unit: r.unit ?? '' });
      }
    }
  }

  return (
    <div
      className={`pointer-events-none absolute bottom-3 left-3 z-20 space-y-2 ${className ?? ''}`}
    >
      {/* Selected zone detail */}
      {selectedZoneId && selectedReadings.length > 0 && (
        <div className="pointer-events-auto rounded-lg bg-white/95 p-3 shadow-lg backdrop-blur">
          <p className="mb-2 text-xs font-semibold text-gray-700">
            Sensors — Zone {selectedZoneId.slice(0, 8)}
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {selectedReadings.map((r) => (
              <div key={r.sensor_type} className="flex items-center gap-1 text-xs">
                <span>{SENSOR_ICON[r.sensor_type] ?? '📊'}</span>
                <span
                  className={`font-mono font-medium ${getThresholdColor(r.sensor_type, r.value)}`}
                >
                  {r.value.toFixed(1)}
                </span>
                <span className="text-gray-400">{r.unit ?? ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global alert summary */}
      {alerts.length > 0 && (
        <div className="pointer-events-auto max-h-32 overflow-y-auto rounded-lg bg-red-50/95 p-2 shadow-lg backdrop-blur">
          <p className="mb-1 text-[10px] font-semibold text-red-700">
            ⚠ {alerts.length} sensor alert{alerts.length !== 1 ? 's' : ''}
          </p>
          {alerts.slice(0, 6).map((a, i) => (
            <p key={i} className="text-[10px] text-red-600">
              {SENSOR_ICON[a.type]} {a.type}: {a.value.toFixed(1)}
              {a.unit}
            </p>
          ))}
          {alerts.length > 6 && (
            <p className="text-[10px] text-red-400">+{alerts.length - 6} more</p>
          )}
        </div>
      )}
    </div>
  );
}
