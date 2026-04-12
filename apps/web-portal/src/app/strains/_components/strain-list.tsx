'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStrains } from '@/hooks';
import { DataTable, Button } from '@gacp-erp/ui-components';
import type { ColumnDef, PaginationState } from '@gacp-erp/ui-components';

interface Strain {
  id: string;
  name: string;
  cultivar_code: string;
  species: string;
  thc_percentage_min?: number;
  thc_percentage_max?: number;
  cbd_percentage_min?: number;
  cbd_percentage_max?: number;
  is_active: boolean;
  current_inspection_status?: string | null;
  supplier_id?: string;
  created_at: string;
}

type StatusBadgeInfo = { cls: string; label: string };

function getStrainStatus(isActive: boolean, inspectionStatus?: string | null): StatusBadgeInfo {
  switch (inspectionStatus) {
    case 'PENDING':
      return { cls: 'bg-blue-100 text-blue-700', label: 'Insp. Pending' };
    case 'IN_PROGRESS':
      return { cls: 'bg-blue-100 text-blue-800', label: 'Inspecting' };
    case 'QUARANTINE':
      return { cls: 'bg-amber-100 text-amber-700', label: 'Quarantine' };
    case 'REJECTED':
      return { cls: 'bg-red-100 text-red-700', label: 'Rejected' };
    case 'RELEASED':
    default:
      break;
  }
  return isActive
    ? { cls: 'bg-green-100 text-green-700', label: 'Active' }
    : { cls: 'bg-gray-100 text-gray-600', label: 'Inactive' };
}

function formatRange(min?: number, max?: number, unit = '%'): string {
  if (min != null && max != null) return `${min}–${max}${unit}`;
  if (max != null) return `≤${max}${unit}`;
  if (min != null) return `≥${min}${unit}`;
  return '—';
}

const columns: ColumnDef<Strain, unknown>[] = [
  {
    accessorKey: 'cultivar_code',
    header: 'Code',
    cell: ({ row }) => (
      <span className="font-mono font-medium text-indigo-600">{row.original.cultivar_code}</span>
    ),
  },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'species', header: 'Species' },
  {
    id: 'thc',
    header: 'THC',
    cell: ({ row }) =>
      formatRange(row.original.thc_percentage_min, row.original.thc_percentage_max),
  },
  {
    id: 'cbd',
    header: 'CBD',
    cell: ({ row }) =>
      formatRange(row.original.cbd_percentage_min, row.original.cbd_percentage_max),
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ row }) => {
      const badge = getStrainStatus(row.original.is_active, row.original.current_inspection_status);
      return (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}>
          {badge.label}
        </span>
      );
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
  },
];

export function StrainList() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useStrains({ page, limit: 20 });

  const strains = (data?.data as unknown as Strain[]) ?? [];
  const total = data?.total ?? 0;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Strains / Genetics</h1>
          <p className="text-sm text-gray-500">
            {total} strain{total !== 1 ? 's' : ''} registered
          </p>
        </div>
        <Link href="/strains/new">
          <Button>Register Strain</Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={strains}
        totalRows={total}
        pageSize={20}
        onPaginationChange={(p: PaginationState) => setPage(p.pageIndex + 1)}
        searchPlaceholder="Search strains..."
        emptyMessage={
          isError ? 'Failed to load strains.' : isLoading ? 'Loading...' : 'No strains found.'
        }
      />
    </>
  );
}
