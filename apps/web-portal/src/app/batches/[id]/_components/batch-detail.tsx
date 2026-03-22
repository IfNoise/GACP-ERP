'use client';

import Link from 'next/link';
import { useBatch, useBatchHarvests, usePlants } from '@/hooks';
import { StatusBadge, Button, DataTable } from '@gacp-erp/ui-components';
import type { ColumnDef } from '@gacp-erp/ui-components';

const statusVariant: Record<
  string,
  'draft' | 'pending' | 'active' | 'approved' | 'closed' | 'rejected' | 'cancelled'
> = {
  PLANNED: 'draft',
  ACTIVE: 'active',
  HARVESTING: 'pending',
  COMPLETED: 'closed',
  DESTROYED: 'rejected',
  ON_HOLD: 'cancelled',
};

const gradeColors: Record<string, string> = {
  AAA: 'text-green-700 bg-green-50',
  AA: 'text-green-600 bg-green-50',
  A: 'text-blue-600 bg-blue-50',
  B: 'text-amber-600 bg-amber-50',
  C: 'text-orange-600 bg-orange-50',
  REJECTED: 'text-red-600 bg-red-50',
};

interface PlantRow {
  id: string;
  plant_code: string;
  current_stage: string;
  health_score?: number;
}

interface HarvestRow {
  id: string;
  wet_weight_grams: number;
  dry_weight_grams?: number | null;
  moisture_content_percent: number;
  quality_grade: string;
  harvested_at: string;
}

const plantColumns: ColumnDef<PlantRow, unknown>[] = [
  {
    accessorKey: 'plant_code',
    header: 'Plant Code',
    cell: ({ row }) => (
      <Link
        href={`/plants/${row.original.id}`}
        className="font-medium text-green-700 hover:underline"
      >
        {row.original.plant_code}
      </Link>
    ),
  },
  {
    accessorKey: 'current_stage',
    header: 'Stage',
    cell: ({ row }) => <span className="text-sm text-gray-700">{row.original.current_stage}</span>,
  },
  {
    accessorKey: 'health_score',
    header: 'Health',
    cell: ({ row }) => {
      const s = row.original.health_score;
      if (s == null) return <span className="text-gray-400">—</span>;
      return <span className="font-semibold">{s}%</span>;
    },
  },
];

const harvestColumns: ColumnDef<HarvestRow, unknown>[] = [
  {
    accessorKey: 'harvested_at',
    header: 'Date',
    cell: ({ row }) => (
      <span className="text-sm">{new Date(row.original.harvested_at).toLocaleDateString()}</span>
    ),
  },
  {
    accessorKey: 'wet_weight_grams',
    header: 'Wet (g)',
    cell: ({ row }) => <span>{row.original.wet_weight_grams.toFixed(1)}</span>,
  },
  {
    accessorKey: 'dry_weight_grams',
    header: 'Dry (g)',
    cell: ({ row }) => {
      const w = row.original.dry_weight_grams;
      return w != null ? <span>{w.toFixed(1)}</span> : <span className="text-gray-400">—</span>;
    },
  },
  {
    accessorKey: 'moisture_content_percent',
    header: 'Moisture %',
    cell: ({ row }) => <span>{row.original.moisture_content_percent}%</span>,
  },
  {
    accessorKey: 'quality_grade',
    header: 'Grade',
    cell: ({ row }) => {
      const grade = row.original.quality_grade;
      return (
        <span
          className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${gradeColors[grade] ?? ''}`}
        >
          {grade}
        </span>
      );
    },
  },
];

export function BatchDetail({ id }: { id: string }) {
  const { data: batch, isLoading, isError } = useBatch(id);
  const { data: harvests } = useBatchHarvests(id);
  const { data: plantsData } = usePlants({ batch_id: id, limit: 100 });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
      </div>
    );
  }

  if (isError || !batch) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-600">Failed to load batch details.</p>
        <Link href="/batches" className="mt-2 inline-block text-sm text-green-700 underline">
          ← Back to batches
        </Link>
      </div>
    );
  }

  const b = batch as Record<string, unknown>;
  const status = (b['status'] as string) ?? 'PLANNED';
  const planned = (b['planned_plant_count'] as number) ?? 0;
  const actual = (b['actual_plant_count'] as number) ?? 0;
  const pct = planned > 0 ? Math.round((actual / planned) * 100) : 0;

  const plants = ((plantsData as { data?: PlantRow[] })?.data ?? []) as PlantRow[];
  const harvestList = (harvests as HarvestRow[]) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/batches" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to batches
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{String(b['batch_number'])}</h1>
          <div className="mt-2">
            <StatusBadge status={statusVariant[status] ?? 'draft'} label={status} />
          </div>
        </div>
        <div className="flex gap-2">
          {(status === 'ACTIVE' || status === 'HARVESTING') && (
            <Link href={`/batches/${id}/harvest`}>
              <Button>Record Harvest</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-500">Plants</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {actual} / {planned}
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-500">Planned Start</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {b['planned_start_date']
                ? new Date(b['planned_start_date'] as string).toLocaleDateString()
                : '—'}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-500">Planned Harvest</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {b['planned_harvest_date']
                ? new Date(b['planned_harvest_date'] as string).toLocaleDateString()
                : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Batch Details */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold text-gray-900">Batch Information</h2>
        </div>
        <div className="card-body">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Batch Number</dt>
              <dd className="font-medium text-gray-900">{String(b['batch_number'])}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Compliance Status</dt>
              <dd className="font-medium text-gray-900">{String(b['compliance_status'] ?? '—')}</dd>
            </div>
            {b['zone_id'] ? (
              <div>
                <dt className="text-gray-500">Zone</dt>
                <dd className="font-medium text-gray-900">{String(b['zone_id'])}</dd>
              </div>
            ) : null}
            {b['notes'] ? (
              <div className="col-span-2">
                <dt className="text-gray-500">Notes</dt>
                <dd className="mt-1 text-gray-900">{String(b['notes'])}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>

      {/* Plant List */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Plants ({plants.length})</h2>
          <Link href={`/plants/new?batch_id=${id}`}>
            <Button variant="secondary" size="sm">
              + Add Plant
            </Button>
          </Link>
        </div>
        <div className="card-body">
          <DataTable
            data={plants}
            columns={plantColumns}
            pageSize={10}
            emptyMessage="No plants in this batch."
          />
        </div>
      </div>

      {/* Harvest Records */}
      {harvestList.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Harvest Records ({harvestList.length})</h2>
          </div>
          <div className="card-body">
            <DataTable data={harvestList} columns={harvestColumns} pageSize={10} />
          </div>
        </div>
      )}
    </div>
  );
}
