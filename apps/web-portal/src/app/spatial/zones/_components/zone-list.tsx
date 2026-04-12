'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useZones } from '@/hooks';
import { DataTable, StatusBadge, buttonVariants } from '@gacp-erp/ui-components';
import type { StatusVariant } from '@gacp-erp/ui-components';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';

const ZONE_TYPES = [
  'CULTIVATION',
  'PROCESSING',
  'STORAGE',
  'UTILITY',
  'OFFICE',
  'QUARANTINE',
] as const;

const TYPE_VARIANT: Record<string, StatusVariant> = {
  CULTIVATION: 'active',
  PROCESSING: 'pending',
  STORAGE: 'approved',
  UTILITY: 'draft',
  OFFICE: 'draft',
  QUARANTINE: 'overdue',
};

export function ZoneList() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [typeFilter, setTypeFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  const { data, isLoading } = useZones({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    ...(typeFilter ? { zone_type: typeFilter } : {}),
    ...(activeFilter ? { is_active: activeFilter } : {}),
  });

  const columns: ColumnDef<Record<string, unknown>>[] = [
    {
      accessorKey: 'zone_code',
      header: 'Code',
      cell: ({ row }) => (
        <Link
          href={`/spatial/zones/${String(row.original['id'])}`}
          className="font-medium text-green-700 hover:underline"
        >
          {String(row.original['zone_code'])}
        </Link>
      ),
    },
    { accessorKey: 'zone_name', header: 'Name' },
    {
      accessorKey: 'zone_type',
      header: 'Type',
      cell: ({ row }) => {
        const t = String(row.original['zone_type']);
        return <StatusBadge status={TYPE_VARIANT[t] ?? 'draft'} label={t} />;
      },
    },
    {
      accessorKey: 'current_occupancy',
      header: 'Occupancy',
      cell: ({ row }) => {
        const occ = Number(row.original['current_occupancy'] ?? 0);
        const cap = Number(row.original['capacity'] ?? 0);
        return cap > 0 ? `${occ} / ${cap}` : String(occ);
      },
    },
    {
      accessorKey: 'area_sqm',
      header: 'Area (m²)',
      cell: ({ row }) => {
        const area = row.original['area_sqm'];
        return area != null ? Number(area).toLocaleString() : '—';
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
  ];

  const items = (data as Record<string, unknown>)?.['data'] as
    | Record<string, unknown>[]
    | undefined;
  const total = (data as Record<string, unknown>)?.['total'] as number | undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facility Zones</h1>
          <p className="mt-1 text-sm text-gray-500">Manage spatial zones and batch assignments</p>
        </div>
        <Link href="/spatial/zones/new" className={buttonVariants()}>
          New Zone
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
          {ZONE_TYPES.map((t) => (
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
        <div className="animate-pulse p-6 text-center">Loading zones...</div>
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
