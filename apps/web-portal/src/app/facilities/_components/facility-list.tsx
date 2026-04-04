'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFacilities, useCreateFacility } from '@/hooks';
import { DataTable, StatusBadge, Button } from '@gacp-erp/ui-components';
import type { ColumnDef, PaginationState } from '@gacp-erp/ui-components';

interface Facility {
  id: string;
  facility_code: string;
  name: string;
  license_number: string;
  address: string;
  is_active: boolean;
  created_at: string;
}

const columns: ColumnDef<Facility, unknown>[] = [
  {
    accessorKey: 'facility_code',
    header: 'Code',
    cell: ({ row }) => (
      <Link
        href={`/facilities/${row.original.id}`}
        className="font-medium text-green-700 hover:text-green-900 hover:underline"
      >
        {row.original.facility_code}
      </Link>
    ),
  },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'license_number', header: 'License' },
  { accessorKey: 'address', header: 'Address' },
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

export function FacilityList() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useFacilities({ page, limit: 20 });

  const createMutation = useCreateFacility();
  const [form, setForm] = useState({
    facility_code: '',
    name: '',
    license_number: '',
    address: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync(form);
    setForm({ facility_code: '', name: '', license_number: '', address: '' });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Facilities</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Facility'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Code</label>
              <input
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
                value={form.facility_code}
                onChange={(e) => setForm({ ...form, facility_code: e.target.value })}
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
              <label className="block text-sm font-medium text-gray-700">License Number</label>
              <input
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
                value={form.license_number}
                onChange={(e) => setForm({ ...form, license_number: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="mt-4">
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Facility'}
            </Button>
          </div>
        </form>
      )}

      {isLoading && <div className="p-4 text-gray-500">Loading...</div>}

      <DataTable
        columns={columns}
        data={(data?.data as Facility[]) ?? []}
        totalRows={data?.total ?? 0}
        pageSize={20}
        onPaginationChange={(p: PaginationState) => setPage(p.pageIndex + 1)}
      />
    </div>
  );
}
