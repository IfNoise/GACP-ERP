'use client';

import Link from 'next/link';
import { useChangeControl } from '@/hooks';
import { StatusBadge, WorkflowTimeline, AuditTrailPanel } from '@gacp-erp/ui-components';
import type { StatusVariant, WorkflowStep, AuditEvent } from '@gacp-erp/ui-components';

const CC_STAGES = [
  'DRAFT',
  'SUBMITTED',
  'IMPACT_ASSESSED',
  'APPROVED',
  'IMPLEMENTING',
  'VERIFIED',
  'CLOSED',
] as const;

const STATUS_VARIANT: Record<string, StatusVariant> = {
  DRAFT: 'draft',
  SUBMITTED: 'pending',
  IMPACT_ASSESSED: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  IMPLEMENTING: 'active',
  VERIFIED: 'approved',
  CLOSED: 'closed',
};

export function ChangeControlDetail({ id }: { id: string }) {
  const { data, isLoading } = useChangeControl(id);

  if (isLoading) return <div className="animate-pulse p-6">Loading change control...</div>;
  if (!data) return <div className="p-6 text-red-600">Change control not found</div>;

  const cc = data as Record<string, unknown>;
  const status = String(cc['status']);
  const impacts = (cc['impacts'] ?? []) as Record<string, unknown>[];
  const approvals = (cc['approvals'] ?? []) as Record<string, unknown>[];

  const steps: WorkflowStep[] = CC_STAGES.map((stage) => {
    const idx = CC_STAGES.indexOf(stage);
    const currentIdx = CC_STAGES.indexOf(status as (typeof CC_STAGES)[number]);
    let stepStatus: 'completed' | 'active' | 'pending' = 'pending';
    if (idx < currentIdx) stepStatus = 'completed';
    else if (idx === currentIdx) stepStatus = 'active';
    return { id: stage, label: stage.replace(/_/g, ' '), status: stepStatus };
  });

  const auditEvents: AuditEvent[] = [
    {
      id: 'created',
      action: 'Created',
      actor: String(cc['created_by'] ?? ''),
      timestamp: String(cc['created_at']),
    },
    ...(String(cc['updated_at']) !== String(cc['created_at'])
      ? [
          {
            id: 'updated',
            action: 'Updated',
            actor: String(cc['updated_by'] ?? ''),
            timestamp: String(cc['updated_at']),
          },
        ]
      : []),
  ];

  const actionLinks: { href: string; label: string; show: boolean }[] = [
    {
      href: `/quality/change-controls/${id}/submit`,
      label: 'Submit for Review',
      show: status === 'DRAFT',
    },
    {
      href: `/quality/change-controls/${id}/assess`,
      label: 'Assess Impact',
      show: status === 'SUBMITTED',
    },
    {
      href: `/quality/change-controls/${id}/approve`,
      label: 'Approve / Reject',
      show: status === 'IMPACT_ASSESSED',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/quality/change-controls" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to change controls
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{String(cc['ccn_number'])}</h1>
          <StatusBadge
            status={STATUS_VARIANT[status] ?? 'draft'}
            label={status.replace(/_/g, ' ')}
          />
        </div>
        <p className="mt-1 text-lg text-gray-700">{String(cc['title'])}</p>
      </div>

      {/* Workflow */}
      <WorkflowTimeline steps={steps} />

      {/* Actions */}
      <div className="flex gap-3">
        {actionLinks
          .filter((a) => a.show)
          .map((a) => (
            <Link key={a.href} href={a.href} className="btn btn-primary">
              {a.label}
            </Link>
          ))}
      </div>

      {/* Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Details</h2>
          </div>
          <div className="card-body">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Type</dt>
                <dd className="font-medium">{String(cc['change_type'])}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Requestor</dt>
                <dd className="font-medium">{String(cc['requestor_id'])}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-gray-500">Description</dt>
                <dd className="mt-1 whitespace-pre-wrap">{String(cc['description'])}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Impact Assessments */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Impact Assessments ({impacts.length})</h2>
          </div>
          <div className="card-body">
            {impacts.length === 0 ? (
              <p className="text-sm text-gray-500">No impact assessments yet</p>
            ) : (
              <div className="space-y-3">
                {impacts.map((imp, i) => (
                  <div key={i} className="rounded border p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{String(imp['area'])}</span>
                      <StatusBadge
                        status={
                          String(imp['risk_level']) === 'CRITICAL'
                            ? 'rejected'
                            : String(imp['risk_level']) === 'HIGH'
                              ? 'overdue'
                              : 'draft'
                        }
                        label={String(imp['risk_level'])}
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {String(imp['impact_description'])}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approvals */}
      {approvals.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Approvals</h2>
          </div>
          <div className="card-body">
            <div className="space-y-2">
              {approvals.map((a, i) => (
                <div key={i} className="flex items-center justify-between rounded border p-3">
                  <span className="text-sm">{String(a['approver_id'])}</span>
                  <StatusBadge
                    status={
                      String(a['status']) === 'APPROVED'
                        ? 'approved'
                        : String(a['status']) === 'REJECTED'
                          ? 'rejected'
                          : 'draft'
                    }
                    label={String(a['status'])}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Audit Trail */}
      <AuditTrailPanel events={auditEvents} />
    </div>
  );
}
