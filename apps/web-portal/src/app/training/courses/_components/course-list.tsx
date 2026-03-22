'use client';

import { useState } from 'react';
import { useCourses } from '@/hooks';
import { DataTable, StatusBadge } from '@gacp-erp/ui-components';
import type { StatusVariant } from '@gacp-erp/ui-components';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';

const TYPE_VARIANT: Record<string, StatusVariant> = {
  INITIAL: 'active',
  REFRESHER: 'pending',
  ANNUAL_RECERTIFICATION: 'overdue',
};

export function CourseList() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [typeFilter, setTypeFilter] = useState('');
  const [mandatoryFilter, setMandatoryFilter] = useState('');

  const { data, isLoading } = useCourses({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    ...(typeFilter ? { training_type: typeFilter } : {}),
    ...(mandatoryFilter ? { is_mandatory: mandatoryFilter } : {}),
  });

  const columns: ColumnDef<Record<string, unknown>>[] = [
    {
      accessorKey: 'course_id',
      header: 'Course ID',
      cell: ({ row }) => (
        <span className="font-mono font-medium">{String(row.original['course_id'])}</span>
      ),
    },
    { accessorKey: 'title', header: 'Title' },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const t = String(row.original['type']);
        return <StatusBadge status={TYPE_VARIANT[t] ?? 'draft'} label={t.replace(/_/g, ' ')} />;
      },
    },
    {
      accessorKey: 'duration_hours',
      header: 'Duration',
      cell: ({ row }) => `${String(row.original['duration_hours'])}h`,
    },
    {
      accessorKey: 'passing_score',
      header: 'Pass Score',
      cell: ({ row }) => `${String(row.original['passing_score'])}%`,
    },
    {
      accessorKey: 'applicable_roles',
      header: 'Roles',
      cell: ({ row }) => {
        const roles = (row.original['applicable_roles'] ?? []) as string[];
        return roles.length > 0 ? roles.join(', ') : '—';
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge
          status={row.original['is_active'] ? 'active' : 'closed'}
          label={row.original['is_active'] ? 'Active' : 'Inactive'}
        />
      ),
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
          <h1 className="text-2xl font-bold text-gray-900">Training Courses</h1>
          <p className="mt-1 text-sm text-gray-500">Course catalog and training requirements</p>
        </div>
      </div>

      <div className="flex gap-3">
        <select
          className="input w-52"
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        >
          <option value="">All Types</option>
          <option value="INITIAL">Initial</option>
          <option value="REFRESHER">Refresher</option>
          <option value="ANNUAL_RECERTIFICATION">Annual Recertification</option>
        </select>
        <select
          className="input w-44"
          value={mandatoryFilter}
          onChange={(e) => {
            setMandatoryFilter(e.target.value);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        >
          <option value="">All</option>
          <option value="true">Mandatory Only</option>
          <option value="false">Optional Only</option>
        </select>
      </div>

      {isLoading ? (
        <div className="animate-pulse p-6 text-center">Loading courses...</div>
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
