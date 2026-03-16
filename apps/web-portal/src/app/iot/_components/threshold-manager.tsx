'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AlertThreshold } from '@gacp-erp/shared-schemas';
import { ThresholdForm } from './threshold-form';

interface ThresholdManagerProps {
  zoneId: string;
  canManage: boolean;
}

const LEVEL_BADGE: Record<string, string> = {
  WARNING: 'bg-yellow-100 text-yellow-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

export function ThresholdManager({ zoneId, canManage }: ThresholdManagerProps) {
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [deactivating, setDeactivating] = useState<string | null>(null);

  const fetchThresholds = useCallback(async () => {
    try {
      const res = await fetch(`/api/iot/thresholds?zone_id=${zoneId}&active_only=true`);
      if (res.ok) {
        const data = (await res.json()) as AlertThreshold[];
        setThresholds(data);
      }
    } finally {
      setLoading(false);
    }
  }, [zoneId]);

  useEffect(() => {
    void fetchThresholds();
  }, [fetchThresholds]);

  const handleDeactivate = async (id: string) => {
    setDeactivating(id);
    try {
      await fetch(`/api/iot/thresholds/${id}`, { method: 'DELETE' });
      setThresholds((prev) => prev.filter((t) => t.id !== id));
    } finally {
      setDeactivating(null);
    }
  };

  const handleCreated = (threshold: AlertThreshold) => {
    setThresholds((prev) => [threshold, ...prev]);
  };

  if (loading) return <p className="text-sm text-gray-500">Loading thresholds…</p>;

  return (
    <div className="space-y-3">
      {canManage && <ThresholdForm zoneId={zoneId} onCreated={handleCreated} />}

      {thresholds.length === 0 ? (
        <p className="text-sm text-gray-500">No active thresholds defined for this zone.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs font-medium text-gray-500 uppercase">
              <th className="pb-2 pr-4">Sensor</th>
              <th className="pb-2 pr-4">Min</th>
              <th className="pb-2 pr-4">Max</th>
              <th className="pb-2 pr-4">Level</th>
              {canManage && <th className="pb-2">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {thresholds.map((t) => (
              <tr key={t.id}>
                <td className="py-2 pr-4 font-medium">{t.sensor_type.replace(/_/g, ' ')}</td>
                <td className="py-2 pr-4 text-gray-700">{t.min_value ?? '—'}</td>
                <td className="py-2 pr-4 text-gray-700">{t.max_value ?? '—'}</td>
                <td className="py-2 pr-4">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${LEVEL_BADGE[t.alert_level]}`}
                  >
                    {t.alert_level}
                  </span>
                </td>
                {canManage && (
                  <td className="py-2">
                    <button
                      onClick={() => void handleDeactivate(t.id)}
                      disabled={deactivating === t.id}
                      className="text-xs text-red-600 hover:underline disabled:opacity-50"
                    >
                      {deactivating === t.id ? 'Removing…' : 'Deactivate'}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
