'use client';

import Link from 'next/link';
import { useDeviation } from '@/hooks';
import { StatusBadge, WorkflowTimeline, AuditTrailPanel } from '@gacp-erp/ui-components';
import type { StatusVariant, WorkflowStep, AuditEvent } from '@gacp-erp/ui-components';

const DEV_STAGES = [
  'REPORTED',
  'UNDER_INVESTIGATION',
  'IMPACT_ASSESSED',
  'CAPA_INITIATED',
  'CLOSED',
] as const;

const CLASS_VARIANT: Record<string, StatusVariant> = {
  MINOR: 'draft',
  MAJOR: 'pending',
  CRITICAL: 'overdue',
};
const STATUS_VARIANT: Record<string, StatusVariant> = {
  REPORTED: 'active',
  UNDER_INVESTIGATION: 'pending',
  IMPACT_ASSESSED: 'pending',
  CAPA_INITIATED: 'pending',
  CLOSED: 'closed',
};

export function DeviationDetail({ id }: { id: string }) {
  const { data, isLoading } = useDeviation(id);

  if (isLoading) return <div className="animate-pulse p-6">Loading deviation...</div>;
  if (!data) return <div className="p-6 text-red-600">Deviation not found</div>;

  const d = data as Record<string, unknown>;
  const status = String(d['status']);
  const classification = String(d['classification']);

  const steps: WorkflowStep[] = DEV_STAGES.map((stage) => {
    const idx = DEV_STAGES.indexOf(stage);
    const currentIdx = DEV_STAGES.indexOf(status as (typeof DEV_STAGES)[number]);
    let stepStatus: 'completed' | 'active' | 'pending' = 'pending';
    if (idx < currentIdx) stepStatus = 'completed';
    else if (idx === currentIdx) stepStatus = 'active';
    return { id: stage, label: stage.replace(/_/g, ' '), status: stepStatus };
  });

  const auditEvents: AuditEvent[] = [
    {
      id: 'reported',
      action: 'Reported',
      actor: String(d['reported_by'] ?? ''),
      timestamp: String(d['created_at']),
    },
    ...(String(d['updated_at']) !== String(d['created_at'])
      ? [
          {
            id: 'updated',
            action: 'Updated',
            actor: String(d['updated_by'] ?? ''),
            timestamp: String(d['updated_at']),
          },
        ]
      : []),
  ];

  const batchIds = (d['batch_ids'] ?? []) as string[];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/quality/deviations" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to deviations
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{String(d['deviation_number'])}</h1>
          <StatusBadge status={CLASS_VARIANT[classification] ?? 'draft'} label={classification} />
          <StatusBadge
            status={STATUS_VARIANT[status] ?? 'draft'}
            label={status.replace(/_/g, ' ')}
          />
        </div>
        <p className="mt-1 text-lg text-gray-700">{String(d['title'])}</p>
      </div>

      <WorkflowTimeline steps={steps} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Details</h2>
          </div>
          <div className="card-body">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Category</dt>
                <dd className="font-medium">{String(d['category'])}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Reported By</dt>
                <dd className="font-medium">{String(d['reported_by'])}</dd>
              </div>
              {d['location'] ? (
                <div>
                  <dt className="text-gray-500">Location</dt>
                  <dd className="font-medium">{String(d['location'])}</dd>
                </div>
              ) : null}
              {d['occurred_at'] ? (
                <div>
                  <dt className="text-gray-500">Occurred At</dt>
                  <dd className="font-medium">
                    {new Date(String(d['occurred_at'])).toLocaleString()}
                  </dd>
                </div>
              ) : null}
              <div className="col-span-2">
                <dt className="text-gray-500">Description</dt>
                <dd className="mt-1 whitespace-pre-wrap">{String(d['description'])}</dd>
              </div>
              {d['product_impact'] ? (
                <div className="col-span-2">
                  <dt className="text-gray-500">Product Impact</dt>
                  <dd className="mt-1">{String(d['product_impact'])}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>

        <div className="space-y-6">
          {batchIds.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold">Affected Batches</h2>
              </div>
              <div className="card-body">
                <div className="flex flex-wrap gap-2">
                  {batchIds.map((bid) => (
                    <Link
                      key={bid}
                      href={`/batches/${bid}`}
                      className="rounded bg-gray-100 px-2 py-1 text-sm hover:bg-gray-200"
                    >
                      {bid}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {d['linked_capa_id'] ? (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold">Linked CAPA</h2>
              </div>
              <div className="card-body">
                <Link
                  href={`/quality/capas/${String(d['linked_capa_id'])}`}
                  className="text-green-700 hover:underline"
                >
                  {String(d['linked_capa_id'])}
                </Link>
              </div>
            </div>
          ) : null}

          <AuditTrailPanel events={auditEvents} />
        </div>
      </div>
    </div>
  );
}
