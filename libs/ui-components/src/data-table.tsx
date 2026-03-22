'use client';

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
} from '@tanstack/react-table';
import { useState, type ReactNode } from 'react';
import { cn } from './utils';
import { Button } from './button';

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  pageSize?: number;
  searchPlaceholder?: string;
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  toolbar?: ReactNode;
  emptyMessage?: string;
  className?: string;
  /** Server-side pagination */
  totalRows?: number;
  onPaginationChange?: (pagination: PaginationState) => void;
}

export function DataTable<TData>({
  data,
  columns,
  pageSize = 20,
  searchPlaceholder = 'Search...',
  globalFilter: externalFilter,
  onGlobalFilterChange,
  toolbar,
  emptyMessage = 'No results found.',
  className,
  totalRows,
  onPaginationChange,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [internalFilter, setInternalFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  const isServerSide = totalRows !== undefined;
  const globalFilterValue = externalFilter ?? internalFilter;
  const handleFilterChange = onGlobalFilterChange ?? setInternalFilter;

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter: globalFilterValue,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: handleFilterChange,
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater(pagination) : updater;
      setPagination(next);
      onPaginationChange?.(next);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(isServerSide
      ? { pageCount: Math.ceil(totalRows / pagination.pageSize), manualPagination: true as const }
      : { getFilteredRowModel: getFilteredRowModel() }),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={globalFilterValue}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        {toolbar}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500',
                      header.column.getCanSort() &&
                        'cursor-pointer select-none hover:text-gray-900',
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc' && <span>↑</span>}
                      {header.column.getIsSorted() === 'desc' && <span>↓</span>}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="transition hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-gray-700">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-1">
        <span className="text-sm text-gray-500">
          {isServerSide
            ? `${pagination.pageIndex * pagination.pageSize + 1}–${Math.min(
                (pagination.pageIndex + 1) * pagination.pageSize,
                totalRows,
              )} of ${totalRows}`
            : `${table.getFilteredRowModel().rows.length} result(s)`}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export type { DataTableProps, ColumnDef };
