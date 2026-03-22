'use client';

import Link from 'next/link';
import { useValidationProtocol, useValidationProtocolSummary } from '@/hooks';
import { StatusBadge, WorkflowTimeline } from '@gacp-erp/ui-components';
import type { StatusVariant, WorkflowStep } from '@gacp-erp/ui-components';

const VP_STAGES = ['DRAFT', 'REVIEW', 'APPROVED', 'EXECUTING', 'COMPLETED', 'CLOSED'] as const;

const STATUS_VARIANT: Record<string, StatusVariant> = {
  DRAFT: 'draft',
  REVIEW: 'pending',
  APPROVED: 'approved',
  EXECUTING: 'active',
  COMPLETED: 'approved',
  CLOSED: 'closed',
  SUPERSEDED: 'cancelled',
};

const TEST_STATUS_VARIANT: Record<string, StatusVariant> = {
  PENDING: 'draft',
  PASS: 'approved',
  FAIL: 'rejected',
  NOT_APPLICABLE: 'cancelled',
};

export function ValidationProtocolDetail({ id }: { id: string }) {
  const { data, isLoading } = useValidationProtocol(id);
  const { data: summary } = useValidationProtocolSummary(id);

  if (isLoading) return <div className="animate-pulse p-6">Loading protocol...</div>;
  if (!data) return <div className="p-6 text-red-600">Protocol not found</div>;

  const p = data as Record<string, unknown>;
  const status = String(p['status']);
  const testSteps = (p['test_steps'] ?? []) as Record<string, unknown>[];
  const summaryData = summary as Record<string, unknown> | undefined;
  const testSummary = summaryData?.['test_summary'] as Record<string, unknown> | undefined;

  const steps: WorkflowStep[] = VP_STAGES.map((stage) => {
    const idx = VP_STAGES.indexOf(stage);
    const currentIdx = VP_STAGES.indexOf(status as (typeof VP_STAGES)[number]);
    let stepStatus: 'completed' | 'active' | 'pending' = 'pending';
    if (idx < currentIdx) stepStatus = 'completed';
    else if (idx === currentIdx) stepStatus = 'active';
    return { id: stage, label: stage, status: stepStatus };
  });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/quality/validation-protocols"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to protocols
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{String(p['protocol_number'])}</h1>
          <StatusBadge status="active" label={String(p['type'])} />
          <StatusBadge status={STATUS_VARIANT[status] ?? 'draft'} label={status} />
        </div>
        <p className="mt-1 text-lg text-gray-700">{String(p['system_under_test'])}</p>
      </div>

      <WorkflowTimeline steps={steps} />

      {status === 'EXECUTING' && (
        <Link href={`/quality/validation-protocols/${id}/execute`} className="btn btn-primary">
          Execute Test Steps
        </Link>
      )}

      {/* Summary Stats */}
      {testSummary ? (
        <div className="grid gap-4 sm:grid-cols-5">
          {(['total', 'passed', 'failed', 'not_applicable', 'pending'] as const).map((key) => (
            <div key={key} className="card">
              <div className="card-body text-center">
                <div className="text-2xl font-bold">{String(testSummary[key] ?? 0)}</div>
                <div className="text-xs text-gray-500 uppercase">{key.replace(/_/g, ' ')}</div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {testSummary?.['pass_rate_pct'] != null && (
        <div className="card">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Pass Rate:</span>
              <div className="h-3 flex-1 rounded-full bg-gray-200">
                <div
                  className="h-3 rounded-full bg-green-500"
                  style={{ width: `${Number(testSummary['pass_rate_pct'])}%` }}
                />
              </div>
              <span className="text-sm font-bold">{String(testSummary['pass_rate_pct'])}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Test Steps Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Test Steps ({testSteps.length})</h2>
        </div>
        <div className="card-body overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="pb-2 pr-4">#</th>
                <th className="pb-2 pr-4">Description</th>
                <th className="pb-2 pr-4">Expected Result</th>
                <th className="pb-2 pr-4">Actual Result</th>
                <th className="pb-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {testSteps.map((step) => (
                <tr key={String(step['id'])} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{String(step['step_number'])}</td>
                  <td className="py-2 pr-4">{String(step['description'])}</td>
                  <td className="py-2 pr-4">{String(step['expected_result'])}</td>
                  <td className="py-2 pr-4">
                    {step['actual_result'] ? String(step['actual_result']) : '—'}
                  </td>
                  <td className="py-2 pr-4">
                    <StatusBadge
                      status={TEST_STATUS_VARIANT[String(step['status'])] ?? 'draft'}
                      label={String(step['status'])}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
