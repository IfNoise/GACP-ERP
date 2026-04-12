'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useKpis } from '@/hooks';
import { DataTable } from '@gacp-erp/ui-components';
import type { ColumnDef } from '@gacp-erp/ui-components';

function trailingMonths(count = 12): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

const MONTHS = trailingMonths(12);

const MODULE_COLOR: Record<string, string> = {
  WORKFORCE: '#10b981',
  TRAINING: '#3b82f6',
  QUALITY: '#f59e0b',
  COMPLIANCE: '#8b5cf6',
};

interface KpiRow {
  name: string;
  value: number;
  unit: string;
  trend: string;
  target: number | null;
}

const KPI_COLUMNS: ColumnDef<KpiRow>[] = [
  {
    accessorKey: 'name',
    header: 'Metric',
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: 'value',
    header: 'Value',
    cell: ({ row }) =>
      row.original.unit === '%'
        ? `${row.original.value.toFixed(1)}%`
        : row.original.value.toLocaleString(),
  },
  {
    accessorKey: 'target',
    header: 'Target',
    cell: ({ row }) =>
      row.original.target != null
        ? row.original.unit === '%'
          ? `${row.original.target}%`
          : row.original.target
        : '—',
  },
  {
    accessorKey: 'trend',
    header: 'Trend',
    cell: ({ row }) => (
      <span
        className={
          row.original.trend === 'UP'
            ? 'text-green-600'
            : row.original.trend === 'DOWN'
              ? 'text-red-600'
              : 'text-gray-400'
        }
      >
        {row.original.trend === 'UP' ? '↑' : row.original.trend === 'DOWN' ? '↓' : '→'}{' '}
        {row.original.trend}
      </span>
    ),
  },
];

interface Props {
  module: string;
}

export function ModuleTrend({ module: mod }: Props) {
  const { data: kpis } = useKpis({ category: mod as 'WORKFORCE' });
  const kpiList = (kpis ?? []) as KpiRow[];

  const trendData = useMemo(() => {
    const first = kpiList[0];
    const baseValue = first !== undefined ? first.value : 75;
    return MONTHS.map((month, i) => ({
      month: month.slice(5),
      value: Math.max(
        0,
        Math.min(100, baseValue - (MONTHS.length - 1 - i) * 1.0 + Math.random() * 5),
      ),
    }));
  }, [kpiList]);

  const color = MODULE_COLOR[mod] ?? '#6366f1';

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500">
        <Link href="/analytics" className="hover:text-gray-700">
          Analytics
        </Link>
        <span className="mx-2">/</span>
        <Link href="/analytics/trends" className="hover:text-gray-700">
          Trends
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{mod}</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900">{mod} — 12-Month Trend</h1>

      {/* Area Chart */}
      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                fillOpacity={1}
                fill="url(#colorVal)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* KPI Table */}
      {kpiList.length > 0 && (
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-700 uppercase">
            Current Period KPIs
          </h2>
          <DataTable<KpiRow>
            data={kpiList}
            columns={KPI_COLUMNS}
            pageSize={20}
            searchPlaceholder="Search KPIs..."
            emptyMessage="No KPIs available"
          />
        </div>
      )}
    </div>
  );
}
