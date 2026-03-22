'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreatePlant, useBatches, useZones } from '@/hooks';
import { Button } from '@gacp-erp/ui-components';

export function CreatePlantForm() {
  const router = useRouter();
  const createPlant = useCreatePlant();
  const { data: batchesData } = useBatches({ limit: 100 });
  const { data: zonesData } = useZones({ limit: 100 });

  const batches =
    (batchesData as unknown as { data?: { id: string; batch_number: string }[] })?.data ?? [];
  const zones =
    (zonesData as unknown as { data?: { id: string; zone_name: string }[] })?.data ?? [];

  const [form, setForm] = useState({
    batch_id: '',
    strain_id: '',
    facility_id: '',
    zone_id: '',
    plant_code: '',
    notes: '',
  });

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.batch_id || !form.plant_code) return;

    createPlant.mutate(
      {
        batch_id: form.batch_id,
        strain_id: form.strain_id || form.batch_id,
        facility_id: form.facility_id || form.batch_id,
        plant_code: form.plant_code,
        ...(form.zone_id ? { zone_id: form.zone_id } : {}),
        ...(form.notes ? { notes: form.notes } : {}),
      },
      { onSuccess: () => router.push('/plants') },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/plants" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to plants
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">New Plant</h1>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="card-body space-y-5">
          {/* Batch */}
          <div>
            <label htmlFor="batch_id" className="block text-sm font-medium text-gray-700">
              Batch *
            </label>
            <select
              id="batch_id"
              value={form.batch_id}
              onChange={(e) => update('batch_id', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              required
            >
              <option value="">Select batch…</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batch_number}
                </option>
              ))}
            </select>
          </div>

          {/* Zone */}
          <div>
            <label htmlFor="zone_id" className="block text-sm font-medium text-gray-700">
              Zone
            </label>
            <select
              id="zone_id"
              value={form.zone_id}
              onChange={(e) => update('zone_id', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="">No zone</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.zone_name}
                </option>
              ))}
            </select>
          </div>

          {/* Plant Code */}
          <div>
            <label htmlFor="plant_code" className="block text-sm font-medium text-gray-700">
              Plant Code *
            </label>
            <input
              id="plant_code"
              type="text"
              value={form.plant_code}
              onChange={(e) => update('plant_code', e.target.value.toUpperCase())}
              placeholder="e.g. PLANT-2026-001"
              pattern="^[A-Z0-9-]+$"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              required
            />
            <p className="mt-1 text-xs text-gray-400">
              Uppercase letters, digits, and hyphens only
            </p>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              id="notes"
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Optional notes…"
            />
          </div>

          {/* Error */}
          {createPlant.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {createPlant.error.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={createPlant.isPending}>
              {createPlant.isPending ? 'Creating…' : 'Create Plant'}
            </Button>
            <Link href="/plants">
              <Button variant="secondary">Cancel</Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
