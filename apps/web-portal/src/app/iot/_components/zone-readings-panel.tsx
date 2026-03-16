'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AlertThreshold } from '@gacp-erp/shared-schemas';

interface SensorReading {
  sensor_type: string;
  value: number;
  unit?: string;
  timestamp: number;
}

interface ZoneReadingsResult {
  zone_id: string;
  readings: SensorReading[];
}

interface SensorCardProps {
  reading: SensorReading;
  thresholds: AlertThreshold[];
}

function getStatusColor(value: number, thresholds: AlertThreshold[], sensorType: string): string {
  const relevant = thresholds.filter(
    (t) => t.sensor_type === sensorType.toUpperCase() && t.is_active,
  );
  for (const t of relevant) {
    const maxBreached = t.max_value != null && value > t.max_value;
    const minBreached = t.min_value != null && value < t.min_value;
    if (maxBreached || minBreached) {
      return t.alert_level === 'CRITICAL'
        ? 'border-red-500 bg-red-50'
        : 'border-yellow-400 bg-yellow-50';
    }
  }
  return 'border-green-400 bg-green-50';
}

function SensorCard({ reading, thresholds }: SensorCardProps) {
  const colorClass = getStatusColor(reading.value, thresholds, reading.sensor_type);
  const label = reading.sensor_type.replace(/_/g, ' ');

  return (
    <div className={`rounded-lg border-2 p-4 ${colorClass} transition-colors duration-300`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-800">
        {reading.value.toFixed(2)}
        {reading.unit && (
          <span className="ml-1 text-sm font-normal text-gray-600">{reading.unit}</span>
        )}
      </p>
      <p className="mt-1 text-xs text-gray-400">
        {new Date(reading.timestamp * 1000).toLocaleTimeString()}
      </p>
    </div>
  );
}

interface ZoneReadingsPanelProps {
  zoneId: string;
  thresholds: AlertThreshold[];
}

export function ZoneReadingsPanel({ zoneId, thresholds }: ZoneReadingsPanelProps) {
  const [data, setData] = useState<ZoneReadingsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchReadings = useCallback(async () => {
    try {
      const res = await fetch(`/api/iot/zones/${zoneId}/readings`);
      if (res.ok) {
        const json = (await res.json()) as ZoneReadingsResult;
        setData(json);
        setLastUpdated(new Date());
      }
    } catch {
      // silent — keep showing stale data
    } finally {
      setLoading(false);
    }
  }, [zoneId]);

  useEffect(() => {
    void fetchReadings();
    const interval = setInterval(() => void fetchReadings(), 30_000);
    return () => clearInterval(interval);
  }, [fetchReadings]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }

  if (!data || data.readings.length === 0) {
    return (
      <p className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500">
        No sensor data available. Check that Telegraf is running and sensors are publishing to EMQX.
      </p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {data.readings.map((r) => (
          <SensorCard key={r.sensor_type} reading={r} thresholds={thresholds} />
        ))}
      </div>
      {lastUpdated && (
        <p className="mt-2 text-right text-xs text-gray-400">
          Last updated: {lastUpdated.toLocaleTimeString()} · Auto-refreshes every 30s
        </p>
      )}
    </div>
  );
}
