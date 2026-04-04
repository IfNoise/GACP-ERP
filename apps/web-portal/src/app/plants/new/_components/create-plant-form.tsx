'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  useCreatePlant,
  useBatches,
  useRoomZones,
  useFacilities,
  useBuildings,
  useBuildingRooms,
} from '@/hooks';
import { Button } from '@gacp-erp/ui-components';

export function CreatePlantForm() {
  const router = useRouter();
  const createPlant = useCreatePlant();
  const { data: batchesData } = useBatches({ limit: 100 });

  const batches =
    (batchesData as unknown as { data?: { id: string; batch_number: string; strain_id: string }[] })
      ?.data ?? [];

  const [form, setForm] = useState({
    batch_id: '',
    plant_code: '',
    notes: '',
    // Spatial selectors (cascade: facility → building → room → zone)
    facility_id: '',
    building_id: '',
    room_id: '',
    zone_id: '',
  });

  const { data: facilitiesData } = useFacilities({ limit: 100 });
  const facilities =
    (facilitiesData as unknown as { data?: { id: string; name: string }[] })?.data ?? [];

  const { data: buildingsData } = useBuildings(form.facility_id, { limit: 100 });
  const buildings =
    (buildingsData as unknown as { data?: { id: string; name: string; building_code: string }[] })
      ?.data ?? [];

  const { data: roomsData } = useBuildingRooms(form.building_id, { limit: 100 });
  const rooms =
    (roomsData as unknown as { data?: { id: string; room_code: string; name: string }[] })?.data ??
    [];

  const { data: zonesData } = useRoomZones(form.room_id, { limit: 100 });
  const zones =
    (zonesData as unknown as { data?: { id: string; zone_name: string }[] })?.data ?? [];

  const update = (field: string, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Reset dependent cascading fields
      if (field === 'facility_id') {
        next.building_id = '';
        next.room_id = '';
        next.zone_id = '';
      } else if (field === 'building_id') {
        next.room_id = '';
        next.zone_id = '';
      } else if (field === 'room_id') {
        next.zone_id = '';
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.batch_id || !form.plant_code || !form.zone_id) return;

    const selectedBatch = batches.find((b) => b.id === form.batch_id);
    const strainId = selectedBatch?.strain_id ?? form.batch_id;

    createPlant.mutate(
      {
        batch_id: form.batch_id,
        strain_id: strainId,
        zone_id: form.zone_id,
        plant_code: form.plant_code,
        ...(form.notes ? { notes: form.notes } : {}),
      },
      { onSuccess: () => router.push('/plants') },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/plants" className="text-sm text-gray-500 hover:text-gray-700">
          &larr; Back to plants
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
              <option value="">Select batch...</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batch_number}
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

          {/* Location cascade: Facility → Building → Room → Zone */}
          <fieldset className="space-y-4 rounded-lg border border-gray-200 p-4">
            <legend className="px-2 text-sm font-medium text-gray-700">Location *</legend>

            {/* Facility */}
            <div>
              <label htmlFor="facility_id" className="block text-sm font-medium text-gray-600">
                Facility
              </label>
              <select
                id="facility_id"
                value={form.facility_id}
                onChange={(e) => update('facility_id', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="">Select facility...</option>
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Building */}
            <div>
              <label htmlFor="building_id" className="block text-sm font-medium text-gray-600">
                Building
              </label>
              <select
                id="building_id"
                value={form.building_id}
                onChange={(e) => update('building_id', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                disabled={!form.facility_id}
              >
                <option value="">
                  {form.facility_id ? 'Select building...' : 'Select facility first'}
                </option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.building_code} - {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Room */}
            <div>
              <label htmlFor="room_id" className="block text-sm font-medium text-gray-600">
                Room
              </label>
              <select
                id="room_id"
                value={form.room_id}
                onChange={(e) => update('room_id', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                disabled={!form.building_id}
              >
                <option value="">
                  {form.building_id ? 'Select room...' : 'Select building first'}
                </option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.room_code} - {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Zone */}
            <div>
              <label htmlFor="zone_id" className="block text-sm font-medium text-gray-600">
                Zone *
              </label>
              <select
                id="zone_id"
                value={form.zone_id}
                onChange={(e) => update('zone_id', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                disabled={!form.room_id}
                required
              >
                <option value="">{form.room_id ? 'Select zone...' : 'Select room first'}</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.zone_name}
                  </option>
                ))}
              </select>
            </div>
          </fieldset>

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
          {createPlant.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {createPlant.error.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={createPlant.isPending || !form.zone_id}>
              {createPlant.isPending ? 'Creating...' : 'Create Plant'}
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
