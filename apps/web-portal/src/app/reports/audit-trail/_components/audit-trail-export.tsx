'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuditTrail } from '@/hooks';
import { DataTable } from '@gacp-erp/ui-components';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';

const ENTITY_TYPES = [
  'PLANT',
  'BATCH',
  'ZONE',
  'DOCUMENT',
  'CHANGE_CONTROL',
  'CAPA',
  'DEVIATION',
  'QUALITY_EVENT',
  'TRAINING',
  'EQUIPMENT',
  'USER',
] as const;

export function AuditTrailExport() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 50 });
  const [entityType, setEntityType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [userId, setUserId] = useState('');

  const { data, isLoading } = useAuditTrail({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    ...(entityType ? { entity_type: entityType } : {}),
    ...(dateFrom ? { from: new Date(dateFrom).toISOString() } : {}),
    ...(dateTo ? { to: new Date(dateTo).toISOString() } : {}),
    ...(userId ? { user_id: userId } : {}),
  });

  const rows = ((data as Record<string, unknown> | undefined)?.['data'] ?? []) as Record<
    string,
    unknown
  >[];
  const total = Number((data as Record<string, unknown> | undefined)?.['total'] ?? 0);

  const handleExportCSV = useCallback(() => {
    if (rows.length === 0) return;
    const headers = ['ID', 'Entity Type', 'Action', 'User', 'Timestamp', 'Details'];
    const csvRows = rows.map((r) =>
      [
        String(r['id'] ?? ''),
        String(r['entity_type'] ?? ''),
        String(r['action'] ?? ''),
        String(r['user_id'] ?? ''),
        String(r['timestamp'] ?? r['created_at'] ?? ''),
        JSON.stringify(r['payload'] ?? r['details'] ?? {}),
      ]
        .map((v) => `"${v.replace(/"/g, '""')}"`)
        .join(','),
    );
    const csv = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-trail-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [rows]);

  const handleExportPDF = useCallback(async () => {
    try {
      const apiBase = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api';
      const params = new URLSearchParams();
      if (entityType) params.set('entity_type', entityType);
      if (dateFrom) params.set('from', new Date(dateFrom).toISOString());
      if (dateTo) params.set('to', new Date(dateTo).toISOString());
      if (userId) params.set('user_id', userId);

      const res = await fetch(`${apiBase}/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: 'audit-trail-export',
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          format: 'PDF',
          filters: { entity_type: entityType || undefined, user_id: userId || undefined },
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { url: string };
        window.open(data.url, '_blank');
      }
    } catch {
      // PDF service may not be running yet
    }
  }, [entityType, dateFrom, dateTo, userId]);

  const columns: ColumnDef<Record<string, unknown>>[] = [
    {
      accessorKey: 'id',
      header: 'Event ID',
      cell: ({ row }) => (
        <span className="font-mono text-xs">{String(row.original['id'] ?? '').slice(0, 8)}…</span>
      ),
    },
    {
      accessorKey: 'entity_type',
      header: 'Entity',
      cell: ({ row }) => (
        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium">
          {String(row.original['entity_type'] ?? '')}
        </span>
      ),
    },
    { accessorKey: 'action', header: 'Action' },
    {
      accessorKey: 'user_id',
      header: 'User',
      cell: ({ row }) => (
        <span className="text-xs">{String(row.original['user_id'] ?? '').slice(0, 8)}…</span>
      ),
    },
    {
      accessorKey: 'timestamp',
      header: 'Timestamp',
      cell: ({ row }) => {
        const ts = row.original['timestamp'] ?? row.original['created_at'];
        return ts ? new Date(String(ts)).toLocaleString() : '—';
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500">
        <Link href="/reports" className="hover:text-gray-700">
          Reports
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">Audit Trail Export</span>
      </nav>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Trail Export</h1>
          <p className="text-sm text-gray-500">
            Filter and export immutable audit records for compliance review
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            disabled={rows.length === 0}
            className="rounded-md border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            disabled={rows.length === 0}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Entity Type</label>
          <select
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
            className="rounded border px-3 py-1.5 text-sm"
          >
            <option value="">All</option>
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded border px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded border px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">User ID</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="UUID"
            className="w-40 rounded border px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-gray-500">
        {total} record{total !== 1 ? 's' : ''} found
      </p>

      {/* Table */}
      {isLoading ? (
        <div className="py-12 text-center text-gray-400">Loading audit trail…</div>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          {...(total != null ? { totalRows: total } : {})}
          onPaginationChange={setPagination}
        />
      )}
    </div>
  );
}
