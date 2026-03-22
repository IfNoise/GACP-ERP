'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePlants } from '@/hooks';
import { DataTable, StatusBadge, Button } from '@gacp-erp/ui-components';
import type { ColumnDef } from '@gacp-erp/ui-components';
import type { PaginationState } from '@tanstack/react-table';

interface Plant {
  id: string;
  plant_code: string;
  batch_id: string;
  strain_id: string;
  current_stage: string;
  zone_id?: string;
  health_score?: number;
  last_stage_change_at?: string;
  created_at: string;
}

const STAGE_OPTIONS = [
  'SEED',
  'GERMINATION',
  'CLONING',
  'VEGETATIVE',
  'MOTHER_PLANT',
  'FLOWERING',
  'HARVESTING',
  'HARVESTED',
  'DESTROYED',
] as const;

const stageVariant: Record<
  string,
  'draft' | 'pending' | 'active' | 'approved' | 'closed' | 'rejected' | 'cancelled'
> = {
  SEED: 'draft',
  GERMINATION: 'pending',
  CLONING: 'pending',
  VEGETATIVE: 'active',
  MOTHER_PLANT: 'active',
  FLOWERING: 'approved',
  HARVESTING: 'pending',
  HARVESTED: 'closed',
  DESTROYED: 'rejected',
};

const columns: ColumnDef<Plant, unknown>[] = [
  {
    accessorKey: 'plant_code',
    header: 'Plant Code',
    cell: ({ row }) => (
      <Link
        href={`/plants/${row.original.id}`}
        className="font-medium text-green-700 hover:text-green-900 hover:underline"
      >
        {row.original.plant_code}
      </Link>
    ),
  },
  {
    accessorKey: 'current_stage',
    header: 'Stage',
    cell: ({ row }) => (
      <StatusBadge
        status={stageVariant[row.original.current_stage] ?? 'draft'}
        label={row.original.current_stage}
      />
    ),
  },
  {
    accessorKey: 'health_score',
    header: 'Health',
    cell: ({ row }) => {
      const score = row.original.health_score;
      if (score == null) return <span className="text-gray-400">—</span>;
      const color =
        score >= 80 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-600';
      return <span className={`font-semibold ${color}`}>{score}%</span>;
    },
  },
  {
    accessorKey: 'last_stage_change_at',
    header: 'Last Transition',
    cell: ({ row }) => {
      const dt = row.original.last_stage_change_at;
      if (!dt) return <span className="text-gray-400">—</span>;
      return <span className="text-sm text-gray-600">{new Date(dt).toLocaleDateString()}</span>;
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    cell: ({ row }) => (
      <span className="text-sm text-gray-600">
        {new Date(row.original.created_at).toLocaleDateString()}
      </span>
    ),
  },
];

export function PlantList() {
  const [page, setPage] = useState(1);
  const [stageFilter, setStageFilter] = useState('');
  const { data, isLoading, isError } = usePlants({
    page,
    limit: 20,
    ...(stageFilter ? { stage: stageFilter } : {}),
  });

  const plants = (data as { data?: Plant[] })?.data ?? [];
  const total = (data as { total?: number })?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plants</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} plant{total !== 1 ? 's' : ''} in database
          </p>
        </div>
        <Link href="/plants/new">
          <Button>+ New Plant</Button>
        </Link>
      </div>

      <DataTable
        data={plants}
        columns={columns}
        totalRows={total}
        pageSize={20}
        onPaginationChange={(p: PaginationState) => setPage(p.pageIndex + 1)}
        searchPlaceholder="Search plants..."
        toolbar={
          <select
            value={stageFilter}
            onChange={(e) => {
              setStageFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">All Stages</option>
            {STAGE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        }
        emptyMessage={
          isError ? 'Failed to load plants.' : isLoading ? 'Loading...' : 'No plants found.'
        }
      />
    </div>
  );
}
