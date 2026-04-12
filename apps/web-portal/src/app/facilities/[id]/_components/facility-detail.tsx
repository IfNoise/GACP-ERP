'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFacility, useBuildings, useCreateBuilding } from '@/hooks';
import { DataTable, StatusBadge, Button, Badge } from '@gacp-erp/ui-components';
import type { ColumnDef, PaginationState } from '@gacp-erp/ui-components';

const BUILDING_TYPES = ['indoor', 'greenhouse', 'open_ground'] as const;

interface Building {
  id: string;
  building_code: string;
  name: string;
  building_type: string;
  is_active: boolean;
  created_at: string;
}

function getBuildingColumns(facilityId: string): ColumnDef<Building, unknown>[] {
  return [
    {
      accessorKey: 'building_code',
      header: 'Code',
      cell: ({ row }) => (
        <Link
          href={`/facilities/${facilityId}/buildings/${row.original.id}`}
          className="font-medium text-green-700 hover:text-green-900 hover:underline"
        >
          {row.original.building_code}
        </Link>
      ),
    },
    { accessorKey: 'name', header: 'Name' },
    {
      accessorKey: 'building_type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="info">{row.original.building_type.replace('_', ' ')}</Badge>
      ),
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
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
    },
  ];
}

export function FacilityDetail({ facilityId }: { facilityId: string }) {
  const { data: facility, isLoading: facilityLoading } = useFacility(facilityId);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const { data: buildings, isLoading: buildingsLoading } = useBuildings(facilityId, {
    page,
    limit: 20,
  });

  const createMutation = useCreateBuilding();
  const [form, setForm] = useState({
    building_code: '',
    name: '',
    building_type: 'indoor' as (typeof BUILDING_TYPES)[number],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({ facilityId, body: form });
    setForm({ building_code: '', name: '', building_type: 'indoor' });
    setShowForm(false);
  };

  if (facilityLoading) return <div className="p-4 text-gray-500">Loading...</div>;
  if (!facility) return <div className="p-4 text-red-500">Facility not found</div>;

  const f = facility as Record<string, unknown>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/facilities" className="text-gray-500 hover:text-gray-700">
          &larr; Facilities
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{f['name'] as string}</h1>
        <StatusBadge
          status={f['is_active'] ? 'active' : 'closed'}
          label={f['is_active'] ? 'Active' : 'Inactive'}
        />
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <dl className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <dt className="font-medium text-gray-500">Code</dt>
            <dd className="text-gray-900">{f['facility_code'] as string}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">License</dt>
            <dd className="text-gray-900">{f['license_number'] as string}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Address</dt>
            <dd className="text-gray-900">{f['address'] as string}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Created</dt>
            <dd className="text-gray-900">
              {new Date(f['created_at'] as string).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Buildings</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Building'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Building Code</label>
              <input
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
                value={form.building_code}
                onChange={(e) => setForm({ ...form, building_code: e.target.value })}
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
              <label className="block text-sm font-medium text-gray-700">Building Type</label>
              <select
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
                value={form.building_type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    building_type: e.target.value as (typeof BUILDING_TYPES)[number],
                  })
                }
              >
                {BUILDING_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Building'}
            </Button>
          </div>
        </form>
      )}

      {buildingsLoading && <div className="p-4 text-gray-500">Loading buildings...</div>}

      <DataTable
        columns={getBuildingColumns(facilityId)}
        data={(buildings?.data as Building[]) ?? []}
        totalRows={buildings?.total ?? 0}
        pageSize={20}
        onPaginationChange={(p: PaginationState) => setPage(p.pageIndex + 1)}
      />
    </div>
  );
}
