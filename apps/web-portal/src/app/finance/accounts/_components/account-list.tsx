'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAccounts } from '@/hooks';
import { DataTable, StatusBadge } from '@gacp-erp/ui-components';
import type { StatusVariant } from '@gacp-erp/ui-components';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';

const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] as const;

const TYPE_VARIANT: Record<string, StatusVariant> = {
  ASSET: 'active',
  LIABILITY: 'overdue',
  EQUITY: 'approved',
  REVENUE: 'pending',
  EXPENSE: 'rejected',
};

export function AccountList() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [typeFilter, setTypeFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  const { data, isLoading } = useAccounts({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    ...(typeFilter ? { account_type: typeFilter } : {}),
    ...(activeFilter ? { is_active: activeFilter } : {}),
  });

  const columns: ColumnDef<Record<string, unknown>>[] = [
    {
      accessorKey: 'account_code',
      header: 'Code',
      cell: ({ row }) => (
        <span className="font-mono font-medium text-green-700">
          {String(row.original['account_code'])}
        </span>
      ),
    },
    { accessorKey: 'name', header: 'Account Name' },
    {
      accessorKey: 'account_type',
      header: 'Type',
      cell: ({ row }) => {
        const t = String(row.original['account_type']);
        return <StatusBadge status={TYPE_VARIANT[t] ?? 'draft'} label={t} />;
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Active',
      cell: ({ row }) => (
        <StatusBadge
          status={row.original['is_active'] ? 'active' : 'closed'}
          label={row.original['is_active'] ? 'Active' : 'Inactive'}
        />
      ),
    },
    {
      accessorKey: 'parent_id',
      header: 'Parent',
      cell: ({ row }) => {
        const pid = row.original['parent_id'];
        return pid ? (
          <span className="text-sm text-gray-500">{String(pid).slice(0, 8)}…</span>
        ) : (
          '—'
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
          <h1 className="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
          <p className="mt-1 text-sm text-gray-500">Manage financial accounts (IAS 41 compliant)</p>
        </div>
        <Link href="/finance/accounts/new" className="btn btn-primary">
          New Account
        </Link>
      </div>

      <div className="flex gap-3">
        <select
          className="input w-48"
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        >
          <option value="">All Types</option>
          {ACCOUNT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
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
        <div className="animate-pulse p-6 text-center">Loading accounts...</div>
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
