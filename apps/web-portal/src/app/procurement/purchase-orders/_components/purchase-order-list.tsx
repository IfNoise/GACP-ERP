'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePurchaseOrders } from '@/hooks';
import { DataTable, StatusBadge } from '@gacp-erp/ui-components';
import type { StatusVariant } from '@gacp-erp/ui-components';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';

const PO_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'ACKNOWLEDGED',
  'RECEIVING',
  'CLOSED',
  'CANCELLED',
] as const;

const STATUS_VARIANT: Record<string, StatusVariant> = {
  DRAFT: 'draft',
  SUBMITTED: 'pending',
  ACKNOWLEDGED: 'active',
  RECEIVING: 'active',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
};

export function PurchaseOrderList() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = usePurchaseOrders({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    ...(statusFilter ? { status: statusFilter } : {}),
  });

  const columns: ColumnDef<Record<string, unknown>>[] = [
    {
      accessorKey: 'po_number',
      header: 'PO #',
      cell: ({ row }) => (
        <Link
          href={`/procurement/purchase-orders/${String(row.original['id'])}`}
          className="font-medium text-green-700 hover:underline"
        >
          {String(row.original['po_number'])}
        </Link>
      ),
    },
    {
      accessorKey: 'supplier_id',
      header: 'Supplier',
      cell: ({ row }) => {
        const sid = String(row.original['supplier_id']);
        return <span className="text-sm">{sid.slice(0, 8)}…</span>;
      },
    },
    {
      accessorKey: 'total_value',
      header: 'Total Value',
      cell: ({ row }) => {
        const val = Number(row.original['total_value'] ?? 0);
        const cur = String(row.original['currency'] ?? 'USD');
        return `${cur} ${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      },
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
      accessorKey: 'expected_delivery_date',
      header: 'Expected Delivery',
      cell: ({ row }) => {
        const d = row.original['expected_delivery_date'];
        return d ? new Date(String(d)).toLocaleDateString() : '—';
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
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="mt-1 text-sm text-gray-500">Manage procurement purchase orders</p>
        </div>
        <Link href="/procurement/purchase-orders/new" className="btn btn-primary">
          New Purchase Order
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
          {PO_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="animate-pulse p-6 text-center">Loading purchase orders...</div>
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
