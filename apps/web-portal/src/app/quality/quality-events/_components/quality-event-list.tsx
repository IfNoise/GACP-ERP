'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQualityEvents } from '@/hooks';
import { DataTable, StatusBadge } from '@gacp-erp/ui-components';
import type { StatusVariant } from '@gacp-erp/ui-components';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';

const QE_STATUSES = ['OPEN', 'INVESTIGATING', 'CAPA_INITIATED', 'CLOSED'] as const;
const QE_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
const QE_TYPES = ['COMPLAINT', 'AUDIT_FINDING', 'INSPECTION_OBSERVATION', 'QUALITY_ISSUE'] as const;

const STATUS_VARIANT: Record<string, StatusVariant> = {
  OPEN: 'active',
  INVESTIGATING: 'pending',
  CAPA_INITIATED: 'pending',
  CLOSED: 'closed',
};

const SEVERITY_VARIANT: Record<string, StatusVariant> = {
  LOW: 'draft',
  MEDIUM: 'pending',
  HIGH: 'overdue',
  CRITICAL: 'rejected',
};

export function QualityEventList() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data, isLoading } = useQualityEvents({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(severityFilter ? { severity: severityFilter } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
  });

  const columns: ColumnDef<Record<string, unknown>>[] = [
    {
      accessorKey: 'event_number',
      header: 'Event #',
      cell: ({ row }) => (
        <Link
          href={`/quality/quality-events/${String(row.original['id'])}`}
          className="font-medium text-green-700 hover:underline"
        >
          {String(row.original['event_number'])}
        </Link>
      ),
    },
    { accessorKey: 'title', header: 'Title' },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => String(row.original['type']).replace(/_/g, ' '),
    },
    {
      accessorKey: 'severity',
      header: 'Severity',
      cell: ({ row }) => {
        const sev = String(row.original['severity']);
        return <StatusBadge status={SEVERITY_VARIANT[sev] ?? 'draft'} label={sev} />;
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
          <h1 className="text-2xl font-bold text-gray-900">Quality Events</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track complaints, audit findings, and quality issues
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <select
          className="input w-40"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        >
          <option value="">All Statuses</option>
          {QE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <select
          className="input w-36"
          value={severityFilter}
          onChange={(e) => {
            setSeverityFilter(e.target.value);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        >
          <option value="">All Severities</option>
          {QE_SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          className="input w-52"
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        >
          <option value="">All Types</option>
          {QE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="animate-pulse p-6 text-center">Loading quality events...</div>
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
