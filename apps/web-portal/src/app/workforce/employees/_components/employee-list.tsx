'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useEmployees } from '@/hooks';
import { DataTable, StatusBadge, buttonVariants } from '@gacp-erp/ui-components';
import type { StatusVariant } from '@gacp-erp/ui-components';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';

const STATUS_VARIANT: Record<string, StatusVariant> = {
  true: 'active',
  false: 'closed',
};

export function EmployeeList() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [deptFilter, setDeptFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  const { data, isLoading } = useEmployees({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    ...(deptFilter ? { department: deptFilter } : {}),
    ...(activeFilter ? { is_active: activeFilter } : {}),
  });

  const columns: ColumnDef<Record<string, unknown>>[] = [
    {
      accessorKey: 'employee_number',
      header: 'Employee #',
      cell: ({ row }) => (
        <Link
          href={`/workforce/employees/${String(row.original['id'])}`}
          className="font-medium text-green-700 hover:underline"
        >
          {String(row.original['employee_number'])}
        </Link>
      ),
    },
    {
      id: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const firstName = String(row.original['first_name'] ?? '');
        const lastName = String(row.original['last_name'] ?? '');
        return `${firstName} ${lastName}`.trim() || '—';
      },
    },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'position', header: 'Position' },
    { accessorKey: 'department', header: 'Department' },
    {
      accessorKey: 'hire_date',
      header: 'Hire Date',
      cell: ({ row }) => new Date(String(row.original['hire_date'])).toLocaleDateString(),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => {
        const active = String(row.original['is_active']);
        return (
          <StatusBadge
            status={STATUS_VARIANT[active] ?? 'draft'}
            label={row.original['is_active'] ? 'Active' : 'Inactive'}
          />
        );
      },
    },
  ];

  const items = (data as Record<string, unknown>)?.['data'] as
    | Record<string, unknown>[]
    | undefined;
  const total = (data as Record<string, unknown>)?.['total'] as number | undefined;

  // Extract unique departments from data for filter
  const departments = [
    ...new Set((items ?? []).map((e) => String(e['department'] ?? '')).filter(Boolean)),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="mt-1 text-sm text-gray-500">Employee directory and competency profiles</p>
        </div>
        <Link href="/workforce/employees/new" className={buttonVariants()}>
          New Employee
        </Link>
      </div>

      <div className="flex gap-3">
        {departments.length > 0 && (
          <select
            className="input w-48"
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}
        <select
          className="input w-40"
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        >
          <option value="">All</option>
          <option value="true">Active Only</option>
          <option value="false">Inactive Only</option>
        </select>
      </div>

      {isLoading ? (
        <div className="animate-pulse p-6 text-center">Loading employees...</div>
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
