'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useIncomingInspections } from '@/hooks/use-domain-queries';
import {
  DataTable,
  StatusBadge,
  type ColumnDef,
  type StatusVariant,
} from '@gacp-erp/ui-components';

type InspectionStatus = 'PENDING' | 'IN_PROGRESS' | 'QUARANTINE' | 'RELEASED' | 'REJECTED';

const STATUS_VARIANT: Record<InspectionStatus, StatusVariant> = {
  PENDING: 'pending',
  IN_PROGRESS: 'active',
  QUARANTINE: 'draft',
  RELEASED: 'approved',
  REJECTED: 'cancelled',
};

const columns: ColumnDef<Record<string, unknown>>[] = [
  {
    accessorKey: 'inspection_number',
    header: 'Number',
    cell: ({ row }) => (
      <Link
        href={`/quality/incoming-inspections/${row.original['id']}`}
        className="text-blue-600 hover:underline font-mono"
      >
        {row.original['inspection_number'] as string}
      </Link>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original['status'] as InspectionStatus;
      return <StatusBadge status={STATUS_VARIANT[status] ?? 'draft'} />;
    },
  },
  {
    accessorKey: 'supplier_id',
    header: 'Supplier',
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {(row.original['supplier_id'] as string)?.slice(0, 8)}...
      </span>
    ),
  },
  {
    accessorKey: 'strain_id',
    header: 'Strain',
    cell: ({ row }) => {
      const strainId = row.original['strain_id'] as string | null;
      return strainId ? (
        <span className="font-mono text-xs">{strainId.slice(0, 8)}...</span>
      ) : (
        <span className="text-gray-400">-</span>
      );
    },
  },
  {
    accessorKey: 'germination_rate',
    header: 'Germination %',
    cell: ({ row }) => {
      const rate = row.original['germination_rate'] as number | null;
      return rate !== null && rate !== undefined ? `${rate}%` : '-';
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    cell: ({ row }) => new Date(row.original['created_at'] as string).toLocaleDateString(),
  },
];

export function IncomingInspectionList() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<InspectionStatus | ''>('');
  const limit = 20;

  const { data, error } = useIncomingInspections({
    page,
    limit,
    ...(statusFilter ? { status: statusFilter } : {}),
  });

  const items = (data as Record<string, unknown>)?.['data'] as
    | Record<string, unknown>[]
    | undefined;
  const total = ((data as Record<string, unknown>)?.['total'] as number) ?? 0;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incoming Inspections</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quality control inspections for received genetic material
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <select
          className="input w-48"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as InspectionStatus | '');
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="QUARANTINE">Quarantine</option>
          <option value="RELEASED">Released</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
          Failed to load inspections: {error.message}
        </div>
      )}

      <DataTable
        columns={columns}
        data={items ?? []}
        totalRows={total}
        pageSize={limit}
        onPaginationChange={({ pageIndex }) => setPage(pageIndex + 1)}
      />
    </>
  );
}
