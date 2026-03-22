'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useValidationProtocols } from '@/hooks';
import { DataTable, StatusBadge } from '@gacp-erp/ui-components';
import type { StatusVariant } from '@gacp-erp/ui-components';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';

const VP_STATUSES = [
  'DRAFT',
  'REVIEW',
  'APPROVED',
  'EXECUTING',
  'COMPLETED',
  'CLOSED',
  'SUPERSEDED',
] as const;
const VP_TYPES = ['IQ', 'OQ', 'PQ'] as const;

const STATUS_VARIANT: Record<string, StatusVariant> = {
  DRAFT: 'draft',
  REVIEW: 'pending',
  APPROVED: 'approved',
  EXECUTING: 'active',
  COMPLETED: 'approved',
  CLOSED: 'closed',
  SUPERSEDED: 'cancelled',
};

export function ValidationProtocolList() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data, isLoading } = useValidationProtocols({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
  });

  const columns: ColumnDef<Record<string, unknown>>[] = [
    {
      accessorKey: 'protocol_number',
      header: 'Protocol #',
      cell: ({ row }) => (
        <Link
          href={`/quality/validation-protocols/${String(row.original['id'])}`}
          className="font-medium text-green-700 hover:underline"
        >
          {String(row.original['protocol_number'])}
        </Link>
      ),
    },
    { accessorKey: 'system_under_test', header: 'System Under Test' },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <StatusBadge status="active" label={String(row.original['type'])} />,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = String(row.original['status']);
        return <StatusBadge status={STATUS_VARIANT[s] ?? 'draft'} label={s} />;
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
          <h1 className="text-2xl font-bold text-gray-900">Validation Protocols</h1>
          <p className="mt-1 text-sm text-gray-500">IQ/OQ/PQ validation protocols</p>
        </div>
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
          {VP_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          className="input w-32"
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        >
          <option value="">All Types</option>
          {VP_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="animate-pulse p-6 text-center">Loading validation protocols...</div>
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
