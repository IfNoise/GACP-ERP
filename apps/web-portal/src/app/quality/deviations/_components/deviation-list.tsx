'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useDeviations } from '@/hooks';
import { DataTable, StatusBadge, buttonVariants } from '@gacp-erp/ui-components';
import type { StatusVariant } from '@gacp-erp/ui-components';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';

const DEV_STATUSES = [
  'REPORTED',
  'UNDER_INVESTIGATION',
  'IMPACT_ASSESSED',
  'CAPA_INITIATED',
  'CLOSED',
] as const;
const DEV_CLASSIFICATIONS = ['MINOR', 'MAJOR', 'CRITICAL'] as const;
const DEV_CATEGORIES = [
  'PROCESS',
  'EQUIPMENT',
  'MATERIAL',
  'ENVIRONMENTAL',
  'DOCUMENTATION',
  'PERSONNEL',
  'UTILITY',
] as const;

const CLASS_VARIANT: Record<string, StatusVariant> = {
  MINOR: 'draft',
  MAJOR: 'pending',
  CRITICAL: 'overdue',
};
const STATUS_VARIANT: Record<string, StatusVariant> = {
  REPORTED: 'active',
  UNDER_INVESTIGATION: 'pending',
  IMPACT_ASSESSED: 'pending',
  CAPA_INITIATED: 'pending',
  CLOSED: 'closed',
};

export function DeviationList() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');

  const { data, isLoading } = useDeviations({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(classFilter ? { classification: classFilter } : {}),
    ...(catFilter ? { category: catFilter } : {}),
  });

  const columns: ColumnDef<Record<string, unknown>>[] = [
    {
      accessorKey: 'deviation_number',
      header: 'DEV #',
      cell: ({ row }) => (
        <Link
          href={`/quality/deviations/${String(row.original['id'])}`}
          className="font-medium text-green-700 hover:underline"
        >
          {String(row.original['deviation_number'])}
        </Link>
      ),
    },
    { accessorKey: 'title', header: 'Title' },
    {
      accessorKey: 'classification',
      header: 'Classification',
      cell: ({ row }) => {
        const c = String(row.original['classification']);
        return <StatusBadge status={CLASS_VARIANT[c] ?? 'draft'} label={c} />;
      },
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => String(row.original['category']),
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
      header: 'Reported',
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
          <h1 className="text-2xl font-bold text-gray-900">Deviations</h1>
          <p className="mt-1 text-sm text-gray-500">Track and investigate deviations</p>
        </div>
        <Link href="/quality/deviations/new" className={buttonVariants()}>
          Report Deviation
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
          {DEV_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <select
          className="input w-36"
          value={classFilter}
          onChange={(e) => {
            setClassFilter(e.target.value);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        >
          <option value="">All Classes</option>
          {DEV_CLASSIFICATIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className="input w-44"
          value={catFilter}
          onChange={(e) => {
            setCatFilter(e.target.value);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        >
          <option value="">All Categories</option>
          {DEV_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="animate-pulse p-6 text-center">Loading deviations...</div>
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
