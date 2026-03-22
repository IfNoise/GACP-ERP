'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTrainingExecutions } from '@/hooks';
import { DataTable, StatusBadge } from '@gacp-erp/ui-components';
import type { StatusVariant } from '@gacp-erp/ui-components';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';

const EXEC_STATUS_VARIANT: Record<string, StatusVariant> = {
  SCHEDULED: 'pending',
  IN_PROGRESS: 'active',
  COMPLETED: 'approved',
  FAILED: 'rejected',
  EXPIRED: 'overdue',
};

export function TrainingExecutionList() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useTrainingExecutions({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    ...(statusFilter ? { status: statusFilter } : {}),
  });

  const columns: ColumnDef<Record<string, unknown>>[] = [
    {
      accessorKey: 'id',
      header: 'Execution',
      cell: ({ row }) => (
        <Link
          href={`/training/executions/${String(row.original['id'])}`}
          className="font-medium text-green-700 hover:underline"
        >
          {String(row.original['id']).slice(0, 8)}…
        </Link>
      ),
    },
    {
      accessorKey: 'course_id',
      header: 'Course',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{String(row.original['course_id'])}</span>
      ),
    },
    {
      accessorKey: 'employee_id',
      header: 'Employee',
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {String(row.original['employee_id']).slice(0, 8)}…
        </span>
      ),
    },
    {
      accessorKey: 'scheduled_date',
      header: 'Scheduled',
      cell: ({ row }) => {
        const d = row.original['scheduled_date'];
        return d ? new Date(String(d)).toLocaleDateString() : '—';
      },
    },
    {
      accessorKey: 'score',
      header: 'Score',
      cell: ({ row }) => {
        const s = row.original['score'];
        return s != null ? `${String(s)}%` : '—';
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = String(row.original['status']);
        return (
          <StatusBadge status={EXEC_STATUS_VARIANT[s] ?? 'draft'} label={s.replace(/_/g, ' ')} />
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
          <h1 className="text-2xl font-bold text-gray-900">Training Executions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track training sessions and assessment results
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <select
          className="input w-44"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        >
          <option value="">All Statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      {isLoading ? (
        <div className="animate-pulse p-6 text-center">Loading executions...</div>
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
