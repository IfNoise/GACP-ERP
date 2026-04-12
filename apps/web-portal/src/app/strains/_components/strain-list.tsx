'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStrains } from '@/hooks';
import { DataTable, Button, Badge } from '@gacp-erp/ui-components';
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

type BadgeVariant = 'success' | 'warning' | 'destructive' | 'info' | 'default';
type StatusBadgeInfo = { variant: BadgeVariant; label: string };

function getStrainStatus(isActive: boolean, inspectionStatus?: string | null): StatusBadgeInfo {
  switch (inspectionStatus) {
    case 'PENDING':
      return { variant: 'info', label: 'Insp. Pending' };
    case 'IN_PROGRESS':
      return { variant: 'info', label: 'Inspecting' };
    case 'QUARANTINE':
      return { variant: 'warning', label: 'Quarantine' };
    case 'REJECTED':
      return { variant: 'destructive', label: 'Rejected' };
    case 'RELEASED':
    default:
      break;
  }
  return isActive
    ? { variant: 'success', label: 'Active' }
    : { variant: 'default', label: 'Inactive' };
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
      return <Badge variant={badge.variant}>{badge.label}</Badge>;
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
