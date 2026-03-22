'use client';

import Link from 'next/link';
import { useKpis, useTrainingCompliance, useWorkforceSummary, useAuditReadiness } from '@/hooks';

const TREND_ICON: Record<string, string> = { UP: '↑', DOWN: '↓', STABLE: '→' };
const TREND_COLOR: Record<string, string> = {
  UP: 'text-green-600',
  DOWN: 'text-red-600',
  STABLE: 'text-gray-500',
};

function KpiCard({
  name,
  value,
  unit,
  trend,
  target,
}: {
  name: string;
  value: number;
  unit: string;
  trend: string;
  target: number | null;
}) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-gray-500 uppercase">{name}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-gray-900">
          {unit === '%' ? `${value.toFixed(1)}%` : value.toLocaleString()}
        </span>
        <span className={`text-sm font-medium ${TREND_COLOR[trend] ?? 'text-gray-500'}`}>
          {TREND_ICON[trend] ?? ''} {trend}
        </span>
      </div>
      {target != null && (
        <p className="mt-1 text-xs text-gray-400">
          Target: {unit === '%' ? `${target}%` : target.toLocaleString()}
        </p>
      )}
    </div>
  );
}

export function AnalyticsOverview() {
  const { data: kpis, isLoading: kpisLoading } = useKpis();
  const { data: training } = useTrainingCompliance();
  const { data: workforce } = useWorkforceSummary();
  const { data: audit } = useAuditReadiness();

  const kpiList = (kpis ?? []) as {
    name: string;
    value: number;
    unit: string;
    trend: string;
    target: number | null;
  }[];
  const tc = training as Record<string, unknown> | undefined;
  const wf = workforce as Record<string, unknown> | undefined;
  const ar = audit as Record<string, unknown> | undefined;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500">
            GACP operational metrics and compliance indicators
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/analytics/trends"
            className="rounded-md border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            View Trends
          </Link>
          <Link
            href="/reports"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Generate Report
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-700 uppercase">
          Key Performance Indicators
        </h2>
        {kpisLoading ? (
          <div className="py-8 text-center text-gray-400">Loading KPIs…</div>
        ) : kpiList.length === 0 ? (
          <div className="py-8 text-center text-gray-400">No KPI data available</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {kpiList.map((kpi) => (
              <KpiCard key={kpi.name} {...kpi} />
            ))}
          </div>
        )}
      </section>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Training Compliance */}
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 uppercase">Training Compliance</h3>
          {tc ? (
            <div className="mt-3 space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-blue-600">
                  {Number(tc['overallRate']).toFixed(1)}%
                </span>
                <span className="text-sm text-gray-400">overall rate</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${Math.min(Number(tc['overallRate']), 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">
                {(tc['items'] as unknown[])?.length ?? 0} courses tracked
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-400">Loading…</p>
          )}
        </div>

        {/* Workforce */}
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 uppercase">Workforce</h3>
          {wf ? (
            <div className="mt-3 space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-green-600">
                  {Number(wf['taskCompletionRate']).toFixed(1)}%
                </span>
                <span className="text-sm text-gray-400">task completion</span>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-gray-400">Active</dt>
                  <dd className="font-semibold">{Number(wf['activeEmployees'])}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Hours</dt>
                  <dd className="font-semibold">
                    {Number(wf['totalLaborHours']).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-400">Completed</dt>
                  <dd className="font-semibold">{Number(wf['totalTasksCompleted'])}</dd>
                </div>
                <div>
                  <dt className="text-gray-400 text-red-500">Overdue</dt>
                  <dd className="font-semibold text-red-600">{Number(wf['totalTasksOverdue'])}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-400">Loading…</p>
          )}
        </div>

        {/* Audit Readiness */}
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 uppercase">Audit Readiness</h3>
          {ar ? (
            <div className="mt-3 space-y-2">
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-3xl font-bold ${
                    Number(ar['overallScore']) >= 80
                      ? 'text-green-600'
                      : Number(ar['overallScore']) >= 60
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {Number(ar['overallScore']).toFixed(0)}
                </span>
                <span className="text-sm text-gray-400">/ 100</span>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-gray-400">Open CAPAs</dt>
                  <dd className="font-semibold">{Number(ar['openCapaCount'])}</dd>
                </div>
                <div>
                  <dt className="text-gray-400 text-red-500">Critical</dt>
                  <dd className="font-semibold text-red-600">{Number(ar['criticalCapaCount'])}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-400">Loading…</p>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-700 uppercase">Reports & Exports</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Daily Plant Report', href: '/reports/generate?template=daily-plant-report' },
            { label: 'Batch Lifecycle', href: '/reports/generate?template=batch-lifecycle' },
            { label: 'Weekly Summary', href: '/reports/generate?template=weekly-summary' },
            { label: 'Audit Trail Export', href: '/reports/audit-trail' },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg border bg-white p-4 text-sm font-medium text-gray-700 shadow-sm hover:border-blue-300 hover:text-blue-600"
            >
              {label} →
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
