'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRoom, useRoomZones, useCreateCultivationZone } from '@/hooks';
import { DataTable, StatusBadge, Button, Badge } from '@gacp-erp/ui-components';
import type { ColumnDef, PaginationState } from '@gacp-erp/ui-components';

const ZONE_TYPES = [
  'seedling',
  'germination',
  'vegetation',
  'flowering',
  'mother_room',
  'clone_room',
  'drying',
  'curing',
  'storage',
  'processing',
  'quarantine',
] as const;

interface Zone {
  id: string;
  zone_code: string;
  name: string;
  zone_type: string;
  max_plants: number;
  area_m2: number;
  is_active: boolean;
  created_at: string;
}

const zoneColumns: ColumnDef<Zone, unknown>[] = [
  { accessorKey: 'zone_code', header: 'Code' },
  { accessorKey: 'name', header: 'Name' },
  {
    accessorKey: 'zone_type',
    header: 'Type',
    cell: ({ row }) => <Badge variant="success">{row.original.zone_type}</Badge>,
  },
  { accessorKey: 'max_plants', header: 'Max Plants' },
  {
    accessorKey: 'area_m2',
    header: 'Area (m\u00B2)',
    cell: ({ row }) => `${row.original.area_m2} m\u00B2`,
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ row }) => (
      <StatusBadge
        status={row.original.is_active ? 'active' : 'closed'}
        label={row.original.is_active ? 'Active' : 'Inactive'}
      />
    ),
  },
];

export function RoomDetail({
  facilityId,
  buildingId,
  roomId,
}: {
  facilityId: string;
  buildingId: string;
  roomId: string;
}) {
  const { data: room, isLoading: roomLoading } = useRoom(roomId);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const { data: zones, isLoading: zonesLoading } = useRoomZones(roomId, {
    page,
    limit: 20,
  });

  const createMutation = useCreateCultivationZone();
  const [form, setForm] = useState({
    zone_code: '',
    name: '',
    zone_type: 'vegetation' as (typeof ZONE_TYPES)[number],
    max_plants: 0,
    area_m2: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({
      roomId,
      body: {
        ...form,
        max_plants: Number(form.max_plants),
        area_m2: Number(form.area_m2),
      },
    });
    setForm({ zone_code: '', name: '', zone_type: 'vegetation', max_plants: 0, area_m2: 0 });
    setShowForm(false);
  };

  if (roomLoading) return <div className="p-4 text-gray-500">Loading...</div>;
  if (!room) return <div className="p-4 text-red-500">Room not found</div>;

  const r = room as Record<string, unknown>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/facilities/${facilityId}/buildings/${buildingId}`}
          className="text-gray-500 hover:text-gray-700"
        >
          &larr; Back to Building
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{r['name'] as string}</h1>
        <StatusBadge
          status={r['is_active'] ? 'active' : 'closed'}
          label={r['is_active'] ? 'Active' : 'Inactive'}
        />
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <dl className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="font-medium text-gray-500">Room Code</dt>
            <dd className="text-gray-900">{r['room_code'] as string}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Name</dt>
            <dd className="text-gray-900">{r['name'] as string}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Created</dt>
            <dd className="text-gray-900">
              {new Date(r['created_at'] as string).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Zones</h2>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'New Zone'}</Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Zone Code</label>
              <input
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
                value={form.zone_code}
                onChange={(e) => setForm({ ...form, zone_code: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Zone Type</label>
              <select
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
                value={form.zone_type}
                onChange={(e) =>
                  setForm({ ...form, zone_type: e.target.value as (typeof ZONE_TYPES)[number] })
                }
              >
                {ZONE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Max Plants</label>
              <input
                type="number"
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
                value={form.max_plants}
                onChange={(e) => setForm({ ...form, max_plants: Number(e.target.value) })}
                min={0}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Area (m&sup2;)</label>
              <input
                type="number"
                step="0.01"
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
                value={form.area_m2}
                onChange={(e) => setForm({ ...form, area_m2: Number(e.target.value) })}
                min={0}
                required
              />
            </div>
          </div>
          <div className="mt-4">
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Zone'}
            </Button>
          </div>
        </form>
      )}

      {zonesLoading && <div className="p-4 text-gray-500">Loading zones...</div>}

      <DataTable
        columns={zoneColumns}
        data={(zones?.data as Zone[]) ?? []}
        totalRows={zones?.total ?? 0}
        pageSize={20}
        onPaginationChange={(p: PaginationState) => setPage(p.pageIndex + 1)}
      />
    </div>
  );
}
