'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSuppliers } from '@/hooks';
import { DataTable, StatusBadge } from '@gacp-erp/ui-components';
import type { StatusVariant } from '@gacp-erp/ui-components';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';

const QUAL_STATUSES = ['QUALIFIED', 'PROVISIONAL', 'DISQUALIFIED'] as const;

const QUAL_VARIANT: Record<string, StatusVariant> = {
  QUALIFIED: 'approved',
  PROVISIONAL: 'pending',
  DISQUALIFIED: 'rejected',
};

export function SupplierList() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [qualFilter, setQualFilter] = useState('');

  const { data, isLoading } = useSuppliers({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    ...(qualFilter ? { qualification_status: qualFilter } : {}),
  });

  const columns: ColumnDef<Record<string, unknown>>[] = [
    {
      accessorKey: 'supplier_code',
      header: 'Code',
      cell: ({ row }) => (
        <Link
          href={`/procurement/suppliers/${String(row.original['id'])}`}
          className="font-medium text-green-700 hover:underline"
        >
          {String(row.original['supplier_code'])}
        </Link>
      ),
    },
    { accessorKey: 'name', header: 'Supplier Name' },
    {
      accessorKey: 'qualification_status',
      header: 'Qualification',
      cell: ({ row }) => {
        const s = String(row.original['qualification_status']);
        return <StatusBadge status={QUAL_VARIANT[s] ?? 'draft'} label={s} />;
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
      accessorKey: 'qualification_expiry',
      header: 'Qualification Expiry',
      cell: ({ row }) => {
        const exp = row.original['qualification_expiry'];
        return exp ? new Date(String(exp)).toLocaleDateString() : '—';
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
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="mt-1 text-sm text-gray-500">Manage supplier qualifications and contacts</p>
        </div>
        <Link href="/procurement/suppliers/new" className="btn btn-primary">
          New Supplier
        </Link>
      </div>

      <div className="flex gap-3">
        <select
          className="input w-48"
          value={qualFilter}
          onChange={(e) => {
            setQualFilter(e.target.value);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        >
          <option value="">All Qualifications</option>
          {QUAL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="animate-pulse p-6 text-center">Loading suppliers...</div>
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
