'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCAPAs } from '@/hooks';
import { DataTable, StatusBadge, buttonVariants } from '@gacp-erp/ui-components';
import type { StatusVariant } from '@gacp-erp/ui-components';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';

const CAPA_STATUSES = [
  'OPEN',
  'RCA_IN_PROGRESS',
  'ACTION_PLAN',
  'IMPLEMENTING',
  'EFFECTIVENESS_CHECK',
  'CLOSED',
] as const;
const CAPA_TYPES = ['CORRECTIVE', 'PREVENTIVE'] as const;
const CAPA_SOURCES = ['DEVIATION', 'AUDIT', 'COMPLAINT', 'TREND', 'INSPECTION'] as const;

const STATUS_VARIANT: Record<string, StatusVariant> = {
  OPEN: 'active',
  RCA_IN_PROGRESS: 'pending',
  ACTION_PLAN: 'pending',
  IMPLEMENTING: 'active',
  EFFECTIVENESS_CHECK: 'pending',
  CLOSED: 'closed',
};

export function CAPAList() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  const { data, isLoading } = useCAPAs({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(sourceFilter ? { source: sourceFilter } : {}),
  });

  const columns: ColumnDef<Record<string, unknown>>[] = [
    {
      accessorKey: 'capa_number',
      header: 'CAPA #',
      cell: ({ row }) => (
        <Link
          href={`/quality/capas/${String(row.original['id'])}`}
          className="font-medium text-green-700 hover:underline"
        >
          {String(row.original['capa_number'])}
        </Link>
      ),
    },
    { accessorKey: 'title', header: 'Title' },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const t = String(row.original['type']);
        return <StatusBadge status={t === 'CORRECTIVE' ? 'overdue' : 'pending'} label={t} />;
      },
    },
    {
      accessorKey: 'source',
      header: 'Source',
      cell: ({ row }) => String(row.original['source']),
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
      accessorKey: 'due_date',
      header: 'Due Date',
      cell: ({ row }) => {
        const d = row.original['due_date'];
        if (!d) return '—';
        const due = new Date(String(d));
        const overdue = due < new Date() && String(row.original['status']) !== 'CLOSED';
        return (
          <span className={overdue ? 'font-semibold text-red-600' : ''}>
            {due.toLocaleDateString()}
          </span>
        );
      },
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
          <h1 className="text-2xl font-bold text-gray-900">CAPAs</h1>
          <p className="mt-1 text-sm text-gray-500">Corrective and Preventive Actions</p>
        </div>
        <Link href="/quality/capas/new" className={buttonVariants()}>
          New CAPA
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
          {CAPA_STATUSES.map((s) => (
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
          {CAPA_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          className="input w-40"
          value={sourceFilter}
          onChange={(e) => {
            setSourceFilter(e.target.value);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        >
          <option value="">All Sources</option>
          {CAPA_SOURCES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="animate-pulse p-6 text-center">Loading CAPAs...</div>
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
