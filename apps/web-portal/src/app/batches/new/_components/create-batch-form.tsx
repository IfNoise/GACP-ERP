'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreateBatch, useFacilities, useStrains } from '@/hooks';
import { Button, DatePicker } from '@gacp-erp/ui-components';

export function CreateBatchForm() {
  const router = useRouter();
  const createBatch = useCreateBatch();

  const { data: facilitiesData } = useFacilities({ limit: 100 });
  const facilities =
    (facilitiesData as unknown as { data?: { id: string; name: string }[] })?.data ?? [];

  const { data: strainsData } = useStrains({ limit: 100, is_active: 'true' });
  const strains =
    (strainsData as unknown as { data?: { id: string; name: string; cultivar_code: string }[] })
      ?.data ?? [];

  const [form, setForm] = useState({
    batch_number: '',
    strain_id: '',
    facility_id: '',
    planned_plant_count: '',
    planned_start_date: '',
    planned_harvest_date: '',
    notes: '',
  });

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.batch_number || !form.planned_plant_count || !form.facility_id || !form.strain_id)
      return;

    createBatch.mutate(
      {
        batch_number: form.batch_number,
        strain_id: form.strain_id,
        facility_id: form.facility_id,
        planned_plant_count: parseInt(form.planned_plant_count, 10),
        ...(form.planned_start_date
          ? { planned_start_date: new Date(form.planned_start_date).toISOString() }
          : {}),
        ...(form.planned_harvest_date
          ? { planned_harvest_date: new Date(form.planned_harvest_date).toISOString() }
          : {}),
        ...(form.notes ? { notes: form.notes } : {}),
      },
      { onSuccess: () => router.push('/batches') },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/batches" className="text-sm text-gray-500 hover:text-gray-700">
          &larr; Back to batches
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">New Batch</h1>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="card-body space-y-5">
          {/* Batch Number */}
          <div>
            <label htmlFor="batch_number" className="block text-sm font-medium text-gray-700">
              Batch Number *
            </label>
            <input
              id="batch_number"
              type="text"
              value={form.batch_number}
              onChange={(e) => update('batch_number', e.target.value.toUpperCase())}
              placeholder="e.g. BATCH-2026-001"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              required
            />
          </div>

          {/* Facility (license binding) */}
          <div>
            <label htmlFor="facility_id" className="block text-sm font-medium text-gray-700">
              Facility *
            </label>
            <select
              id="facility_id"
              value={form.facility_id}
              onChange={(e) => update('facility_id', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              required
            >
              <option value="">Select facility...</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">Regulatory license binding for this batch</p>
          </div>

          {/* Strain */}
          <div>
            <label htmlFor="strain_id" className="block text-sm font-medium text-gray-700">
              Strain *
            </label>
            <select
              id="strain_id"
              value={form.strain_id}
              onChange={(e) => update('strain_id', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              required
            >
              <option value="">Select strain...</option>
              {strains.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.cultivar_code} — {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Planned Plant Count */}
          <div>
            <label htmlFor="plant_count" className="block text-sm font-medium text-gray-700">
              Planned Plant Count *
            </label>
            <input
              id="plant_count"
              type="number"
              min="1"
              value={form.planned_plant_count}
              onChange={(e) => update('planned_plant_count', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              required
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                Planned Start
              </label>
              <DatePicker
                value={form.planned_start_date ? new Date(form.planned_start_date) : undefined}
                onChange={(date) =>
                  update('planned_start_date', date ? (date.toISOString().split('T')[0] ?? '') : '')
                }
                placeholder="Select start date"
                className="mt-1 w-full"
              />
            </div>
            <div>
              <label htmlFor="harvest_date" className="block text-sm font-medium text-gray-700">
                Planned Harvest
              </label>
              <DatePicker
                value={form.planned_harvest_date ? new Date(form.planned_harvest_date) : undefined}
                onChange={(date) =>
                  update(
                    'planned_harvest_date',
                    date ? (date.toISOString().split('T')[0] ?? '') : '',
                  )
                }
                placeholder="Select harvest date"
                className="mt-1 w-full"
              />
            </div>
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
              placeholder="Optional notes..."
            />
          </div>

          {/* Error */}
          {createBatch.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {createBatch.error.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={createBatch.isPending}>
              {createBatch.isPending ? 'Creating...' : 'Create Batch'}
            </Button>
            <Link href="/batches">
              <Button variant="secondary">Cancel</Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
