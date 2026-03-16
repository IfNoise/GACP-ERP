'use client';

import { useState } from 'react';
import type { AlertThreshold } from '@gacp-erp/shared-schemas';

const SENSOR_TYPES = [
  'TEMPERATURE',
  'HUMIDITY',
  'CO2',
  'LIGHT_INTENSITY',
  'LIGHT_SPECTRUM',
  'SOIL_MOISTURE',
  'SOIL_PH',
  'SOIL_EC',
  'AIR_PRESSURE',
  'VOC',
] as const;

interface ThresholdFormProps {
  zoneId: string;
  onCreated: (threshold: AlertThreshold) => void;
}

export function ThresholdForm({ zoneId, onCreated }: ThresholdFormProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      zone_id: zoneId,
      sensor_type: form.get('sensor_type') as string,
      min_value: form.get('min_value') ? parseFloat(form.get('min_value') as string) : null,
      max_value: form.get('max_value') ? parseFloat(form.get('max_value') as string) : null,
      alert_level: form.get('alert_level') as 'WARNING' | 'CRITICAL',
    };

    try {
      const res = await fetch('/api/iot/thresholds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = (await res.json()) as { message?: string };
        setError(err.message ?? 'Failed to create threshold');
        return;
      }

      const created = (await res.json()) as AlertThreshold;
      onCreated(created);
      setOpen(false);
      (e.target as HTMLFormElement).reset();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        + Add Threshold
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-800">New Alert Threshold</h3>
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <div>
          <label className="block text-xs text-gray-600">Sensor Type</label>
          <select
            name="sensor_type"
            required
            className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
          >
            {SENSOR_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600">Min Value</label>
          <input
            type="number"
            name="min_value"
            step="any"
            placeholder="—"
            className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600">Max Value</label>
          <input
            type="number"
            name="max_value"
            step="any"
            placeholder="—"
            className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600">Alert Level</label>
          <select
            name="alert_level"
            required
            className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
          >
            <option value="WARNING">WARNING</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>

        {error && <p className="col-span-full text-sm text-red-600">{error}</p>}

        <div className="col-span-full flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
