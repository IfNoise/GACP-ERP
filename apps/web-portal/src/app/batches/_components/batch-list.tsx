'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useBatches } from '@/hooks';
import { DataTable, StatusBadge, Button } from '@gacp-erp/ui-components';
import type { ColumnDef, PaginationState } from '@gacp-erp/ui-components';

interface Batch {
  id: string;
  batch_number: string;
  strain_id: string;
  status: string;
  planned_plant_count: number;
  actual_plant_count: number;
  planned_start_date?: string;
  planned_harvest_date?: string;
  created_at: string;
}

const STATUS_OPTIONS = [
  'PLANNED',
  'ACTIVE',
  'HARVESTING',
  'COMPLETED',
  'DESTROYED',
  'ON_HOLD',
] as const;

const statusVariant: Record<
  string,
  'draft' | 'pending' | 'active' | 'approved' | 'closed' | 'rejected' | 'cancelled'
> = {
  PLANNED: 'draft',
  ACTIVE: 'active',
  HARVESTING: 'pending',
  COMPLETED: 'closed',
  DESTROYED: 'rejected',
  ON_HOLD: 'cancelled',
};

const columns: ColumnDef<Batch, unknown>[] = [
  {
    accessorKey: 'batch_number',
    header: 'Batch Number',
    cell: ({ row }) => (
      <Link
        href={`/batches/${row.original.id}`}
        className="font-medium text-green-700 hover:text-green-900 hover:underline"
      >
        {row.original.batch_number}
      </Link>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <StatusBadge
        status={statusVariant[row.original.status] ?? 'draft'}
        label={row.original.status}
      />
    ),
  },
  {
    id: 'progress',
    header: 'Plants',
    cell: ({ row }) => {
      const { actual_plant_count: actual, planned_plant_count: planned } = row.original;
      const pct = planned > 0 ? Math.round((actual / planned) * 100) : 0;
      return (
        <div className="flex items-center gap-2">
          <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <span className="text-xs text-gray-600">
            {actual}/{planned}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'planned_start_date',
    header: 'Start Date',
    cell: ({ row }) => {
      const dt = row.original.planned_start_date;
      if (!dt) return <span className="text-gray-400">—</span>;
      return <span className="text-sm text-gray-600">{new Date(dt).toLocaleDateString()}</span>;
    },
  },
  {
    accessorKey: 'planned_harvest_date',
    header: 'Harvest Date',
    cell: ({ row }) => {
      const dt = row.original.planned_harvest_date;
      if (!dt) return <span className="text-gray-400">—</span>;
      return <span className="text-sm text-gray-600">{new Date(dt).toLocaleDateString()}</span>;
    },
  },
];

export function BatchList() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const { data, isLoading, isError } = useBatches({
    page,
    limit: 20,
  });

  const allBatches = (data as { data?: Batch[] })?.data ?? [];
  const total = (data as { total?: number })?.total ?? 0;
  const batches = statusFilter ? allBatches.filter((b) => b.status === statusFilter) : allBatches;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Batches</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} batch{total !== 1 ? 'es' : ''} in database
          </p>
        </div>
        <Link href="/batches/new">
          <Button>+ New Batch</Button>
        </Link>
      </div>

      <DataTable
        data={batches}
        columns={columns}
        {...(statusFilter ? {} : { totalRows: total })}
        pageSize={20}
        onPaginationChange={(p: PaginationState) => setPage(p.pageIndex + 1)}
        searchPlaceholder="Search batches..."
        toolbar={
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        }
        emptyMessage={
          isError ? 'Failed to load batches.' : isLoading ? 'Loading...' : 'No batches found.'
        }
      />
    </div>
  );
}
