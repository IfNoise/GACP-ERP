'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useChangeControls } from '@/hooks';
import { DataTable, StatusBadge } from '@gacp-erp/ui-components';
import type { StatusVariant } from '@gacp-erp/ui-components';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';

const CC_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'IMPACT_ASSESSED',
  'APPROVED',
  'REJECTED',
  'IMPLEMENTING',
  'VERIFIED',
  'CLOSED',
] as const;
const CC_TYPES = ['MINOR', 'MAJOR', 'EMERGENCY'] as const;

const STATUS_VARIANT: Record<string, StatusVariant> = {
  DRAFT: 'draft',
  SUBMITTED: 'pending',
  IMPACT_ASSESSED: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  IMPLEMENTING: 'active',
  VERIFIED: 'approved',
  CLOSED: 'closed',
};

const TYPE_VARIANT: Record<string, StatusVariant> = {
  MINOR: 'draft',
  MAJOR: 'pending',
  EMERGENCY: 'overdue',
};

export function ChangeControlList() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data, isLoading } = useChangeControls({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(typeFilter ? { change_type: typeFilter } : {}),
  });

  const columns: ColumnDef<Record<string, unknown>>[] = [
    {
      accessorKey: 'ccn_number',
      header: 'CCN #',
      cell: ({ row }) => (
        <Link
          href={`/quality/change-controls/${String(row.original['id'])}`}
          className="font-medium text-green-700 hover:underline"
        >
          {String(row.original['ccn_number'])}
        </Link>
      ),
    },
    { accessorKey: 'title', header: 'Title' },
    {
      accessorKey: 'change_type',
      header: 'Type',
      cell: ({ row }) => {
        const t = String(row.original['change_type']);
        return <StatusBadge status={TYPE_VARIANT[t] ?? 'draft'} label={t} />;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = String(row.original['status']);
        return <StatusBadge status={STATUS_VARIANT[s] ?? 'draft'} label={s.replace(/_/g, ' ')} />;
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => new Date(String(row.original['created_at'])).toLocaleDateString(),
    },
  ];

  const items = (data as Record<string, unknown>)?.['data'] as
    | Record<string, unknown>[]
    | undefined;
  const total = (data as Record<string, unknown>)?.['total'] as number | undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Change Controls</h1>
          <p className="mt-1 text-sm text-gray-500">Manage change control records (CCN)</p>
        </div>
        <Link href="/quality/change-controls/new" className="btn btn-primary">
          New Change Control
        </Link>
      </div>

      <div className="flex gap-3">
        <select
          className="input w-48"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        >
          <option value="">All Statuses</option>
          {CC_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <select
          className="input w-40"
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        >
          <option value="">All Types</option>
          {CC_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="animate-pulse p-6 text-center">Loading change controls...</div>
      ) : (
        <DataTable
          columns={columns}
          data={items ?? []}
          {...(total != null ? { totalRows: total } : {})}
          pageSize={20}
          onPaginationChange={(p: PaginationState) => setPagination(p)}
        />
      )}
    </div>
  );
}
