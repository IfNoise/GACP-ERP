'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useDocuments } from '@/hooks';
import { DataTable, StatusBadge, Button } from '@gacp-erp/ui-components';
import type { StatusVariant } from '@gacp-erp/ui-components';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';

const DOC_TYPES = [
  'SOP',
  'FORM',
  'REPORT',
  'PROTOCOL',
  'POLICY',
  'WORK_INSTRUCTION',
  'SPECIFICATION',
] as const;
const DOC_STATUSES = [
  'DRAFT',
  'UNDER_REVIEW',
  'APPROVED',
  'EFFECTIVE',
  'SUPERSEDED',
  'OBSOLETE',
] as const;

const STATUS_VARIANT: Record<string, StatusVariant> = {
  DRAFT: 'draft',
  UNDER_REVIEW: 'pending',
  APPROVED: 'approved',
  EFFECTIVE: 'active',
  SUPERSEDED: 'overdue',
  OBSOLETE: 'closed',
};

export function DocumentList() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useDocuments({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(typeFilter ? { document_type: typeFilter } : {}),
    ...(search ? { search } : {}),
  });

  const handleSearch = useCallback(() => {
    setSearch(searchInput);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [searchInput]);

  const columns: ColumnDef<Record<string, unknown>>[] = [
    {
      accessorKey: 'document_number',
      header: 'Document #',
      cell: ({ row }) => (
        <Link
          href={`/documents/${String(row.original['id'])}`}
          className="font-medium text-blue-600 hover:underline"
        >
          {String(row.original['document_number'])}
        </Link>
      ),
    },
    { accessorKey: 'title', header: 'Title' },
    {
      accessorKey: 'document_type',
      header: 'Type',
      cell: ({ row }) => (
        <span className="text-xs font-medium text-gray-600">
          {String(row.original['document_type']).replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = String(row.original['status']);
        return (
          <StatusBadge
            status={STATUS_VARIANT[status] ?? 'draft'}
            label={status.replace(/_/g, ' ')}
          />
        );
      },
    },
    {
      accessorKey: 'current_version_id',
      header: 'Version',
      cell: ({ row }) => (
        <span className="text-sm text-gray-500">
          {row.original['current_version_id']
            ? 'v' + String(row.original['current_version_id']).slice(0, 4)
            : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) =>
        row.original['created_at']
          ? new Date(String(row.original['created_at'])).toLocaleDateString()
          : '—',
    },
  ];

  const rows = ((data as Record<string, unknown> | undefined)?.['data'] ?? []) as Record<
    string,
    unknown
  >[];
  const total = Number((data as Record<string, unknown> | undefined)?.['total'] ?? 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Registry</h1>
          <p className="text-sm text-gray-500">GACP/GMP document management with version control</p>
        </div>
        <Link
          href="/documents/upload"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New Document
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
          className="rounded border px-3 py-1.5 text-sm"
        >
          <option value="">All Statuses</option>
          {DOC_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
          className="rounded border px-3 py-1.5 text-sm"
        >
          <option value="">All Types</option>
          {DOC_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, ' ')}
            </option>
          ))}
        </select>

        <div className="flex">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search documents…"
            className="rounded-l border px-3 py-1.5 text-sm"
          />
          <Button variant="secondary" size="sm" onClick={handleSearch} className="rounded-r">
            Search
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-12 text-center text-gray-400">Loading documents…</div>
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
