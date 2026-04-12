'use client';

import { useState } from 'react';
import { useTimeEntries, useCreateTimeEntry, useClockOut } from '@/hooks';
import { DataTable, StatusBadge, Button, DatePicker } from '@gacp-erp/ui-components';
import type { StatusVariant } from '@gacp-erp/ui-components';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';

export function TimeEntryList() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data, isLoading } = useTimeEntries({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    ...(fromDate ? { from_date: fromDate } : {}),
    ...(toDate ? { to_date: toDate } : {}),
  });

  const clockInMutation = useCreateTimeEntry();
  const clockOutMutation = useClockOut();

  const handleClockIn = async () => {
    await clockInMutation.mutateAsync({
      recorded_via: 'WEB',
    } as Parameters<typeof clockInMutation.mutateAsync>[0]);
  };

  const handleClockOut = async (entryId: string) => {
    await clockOutMutation.mutateAsync({
      id: entryId,
      body: {} as unknown as Parameters<typeof clockOutMutation.mutateAsync>[0]['body'],
    });
  };

  const columns: ColumnDef<Record<string, unknown>>[] = [
    {
      accessorKey: 'employee_id',
      header: 'Employee',
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {String(row.original['employee_id']).slice(0, 8)}…
        </span>
      ),
    },
    {
      accessorKey: 'clock_in_at',
      header: 'Clock In',
      cell: ({ row }) => new Date(String(row.original['clock_in_at'])).toLocaleString(),
    },
    {
      accessorKey: 'clock_out_at',
      header: 'Clock Out',
      cell: ({ row }) => {
        const out = row.original['clock_out_at'];
        return out ? (
          new Date(String(out)).toLocaleString()
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleClockOut(String(row.original['id']))}
          >
            Clock Out
          </Button>
        );
      },
    },
    {
      accessorKey: 'duration_minutes',
      header: 'Duration',
      cell: ({ row }) => {
        const mins = row.original['duration_minutes'];
        if (!mins) return '—';
        const h = Math.floor(Number(mins) / 60);
        const m = Number(mins) % 60;
        return `${h}h ${m}m`;
      },
    },
    {
      accessorKey: 'recorded_via',
      header: 'Via',
      cell: ({ row }) => {
        const via = String(row.original['recorded_via'] ?? 'WEB');
        const variant: Record<string, StatusVariant> = {
          WEB: 'active',
          TERMINAL: 'pending',
          API: 'draft',
        };
        return <StatusBadge status={variant[via] ?? 'draft'} label={via} />;
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
          <h1 className="text-2xl font-bold text-gray-900">Time Entries</h1>
          <p className="mt-1 text-sm text-gray-500">Track clock-in/clock-out and work hours</p>
        </div>
        <Button onClick={handleClockIn} disabled={clockInMutation.isPending}>
          {clockInMutation.isPending ? 'Clocking In...' : 'Clock In'}
        </Button>
      </div>

      <div className="flex gap-3">
        <div>
          <label className="text-xs text-gray-500">From</label>
          <DatePicker
            value={fromDate ? new Date(fromDate) : undefined}
            onChange={(date) => setFromDate(date ? (date.toISOString().split('T')[0] ?? '') : '')}
            placeholder="From date"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">To</label>
          <DatePicker
            value={toDate ? new Date(toDate) : undefined}
            onChange={(date) => setToDate(date ? (date.toISOString().split('T')[0] ?? '') : '')}
            placeholder="To date"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse p-6 text-center">Loading time entries...</div>
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
