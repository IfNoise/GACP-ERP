'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DataPoint {
  time: string;
  [sensorType: string]: number | string;
}

interface TimeSeriesSeries {
  sensor_type: string;
  unit?: string;
  datapoints: [number, number][];
}

interface ZoneHistoryResult {
  zone_id: string;
  from: string;
  to: string;
  series: TimeSeriesSeries[];
}

const SENSOR_COLORS: Record<string, string> = {
  temperature: '#ef4444',
  humidity: '#3b82f6',
  co2: '#10b981',
  light_intensity: '#f59e0b',
  soil_moisture: '#8b5cf6',
  air_pressure: '#6366f1',
};

function getColor(sensorType: string): string {
  return SENSOR_COLORS[sensorType.toLowerCase()] ?? '#64748b';
}

interface ZoneTimeSeriesChartProps {
  zoneId: string;
}

export function ZoneTimeSeriesChart({ zoneId }: ZoneTimeSeriesChartProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [series, setSeries] = useState<TimeSeriesSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'1h' | '6h' | '24h' | '7d'>('6h');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const rangeMs: Record<typeof range, number> = {
      '1h': 3600_000,
      '6h': 21600_000,
      '24h': 86400_000,
      '7d': 604800_000,
    };
    const from = new Date(now.getTime() - rangeMs[range]).toISOString();
    const to = now.toISOString();
    const step = range === '1h' ? '1m' : range === '6h' ? '5m' : range === '24h' ? '15m' : '1h';

    try {
      const res = await fetch(
        `/api/iot/zones/${zoneId}/history?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&step=${step}`,
      );
      if (!res.ok) return;

      const json = (await res.json()) as ZoneHistoryResult;
      setSeries(json.series);

      // Merge all series into chart data array keyed by time
      const timeMap = new Map<number, DataPoint>();
      for (const s of json.series) {
        for (const [ts, val] of s.datapoints) {
          const existing = timeMap.get(ts) ?? { time: new Date(ts * 1000).toLocaleTimeString() };
          existing[s.sensor_type] = val;
          timeMap.set(ts, existing);
        }
      }
      setData(Array.from(timeMap.values()).sort((a, b) => (a.time < b.time ? -1 : 1)));
    } catch {
      // keep stale data
    } finally {
      setLoading(false);
    }
  }, [zoneId, range]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  if (loading) {
    return <div className="h-64 animate-pulse rounded-lg bg-gray-100" />;
  }

  if (data.length === 0) {
    return (
      <p className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500">
        No historical data available for this zone in the selected range.
      </p>
    );
  }

  return (
    <div>
      {/* Range selector */}
      <div className="mb-4 flex gap-2">
        {(['1h', '6h', '24h', '7d'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              range === r
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          {series.map((s) => (
            <Line
              key={s.sensor_type}
              type="monotone"
              dataKey={s.sensor_type}
              stroke={getColor(s.sensor_type)}
              dot={false}
              strokeWidth={2}
              name={`${s.sensor_type.replace(/_/g, ' ')}${s.unit ? ` (${s.unit})` : ''}`}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
