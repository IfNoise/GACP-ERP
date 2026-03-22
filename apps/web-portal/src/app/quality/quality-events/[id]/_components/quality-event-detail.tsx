'use client';

import Link from 'next/link';
import { useQualityEvent } from '@/hooks';
import { StatusBadge, WorkflowTimeline, AuditTrailPanel } from '@gacp-erp/ui-components';
import type { StatusVariant, WorkflowStep, AuditEvent } from '@gacp-erp/ui-components';

const QE_STAGES = ['OPEN', 'INVESTIGATING', 'CAPA_INITIATED', 'CLOSED'] as const;

const STATUS_VARIANT: Record<string, StatusVariant> = {
  OPEN: 'active',
  INVESTIGATING: 'pending',
  CAPA_INITIATED: 'pending',
  CLOSED: 'closed',
};

const SEVERITY_VARIANT: Record<string, StatusVariant> = {
  LOW: 'draft',
  MEDIUM: 'pending',
  HIGH: 'overdue',
  CRITICAL: 'rejected',
};

export function QualityEventDetail({ id }: { id: string }) {
  const { data, isLoading } = useQualityEvent(id);

  if (isLoading) return <div className="animate-pulse p-6">Loading quality event...</div>;
  if (!data) return <div className="p-6 text-red-600">Quality event not found</div>;

  const qe = data as Record<string, unknown>;
  const status = String(qe['status']);
  const severity = String(qe['severity']);

  const steps: WorkflowStep[] = QE_STAGES.map((stage) => {
    const idx = QE_STAGES.indexOf(stage);
    const currentIdx = QE_STAGES.indexOf(status as (typeof QE_STAGES)[number]);
    let stepStatus: 'completed' | 'active' | 'pending' = 'pending';
    if (idx < currentIdx) stepStatus = 'completed';
    else if (idx === currentIdx) stepStatus = 'active';
    return { id: stage, label: stage.replace(/_/g, ' '), status: stepStatus };
  });

  const auditEvents: AuditEvent[] = [
    {
      id: 'reported',
      action: 'Reported',
      actor: String(qe['reported_by'] ?? ''),
      timestamp: String(qe['created_at']),
    },
    ...(String(qe['updated_at']) !== String(qe['created_at'])
      ? [
          {
            id: 'updated',
            action: 'Updated',
            actor: String(qe['updated_by'] ?? ''),
            timestamp: String(qe['updated_at']),
          },
        ]
      : []),
  ];

  const linkedRecords = (qe['linked_records'] ?? []) as {
    record_type: string;
    record_id: string;
  }[];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/quality/quality-events" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to quality events
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{String(qe['event_number'])}</h1>
          <StatusBadge status={SEVERITY_VARIANT[severity] ?? 'draft'} label={severity} />
          <StatusBadge
            status={STATUS_VARIANT[status] ?? 'draft'}
            label={status.replace(/_/g, ' ')}
          />
        </div>
        <p className="mt-1 text-lg text-gray-700">{String(qe['title'])}</p>
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
                <dt className="text-gray-500">Type</dt>
                <dd className="font-medium">{String(qe['type']).replace(/_/g, ' ')}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Severity</dt>
                <dd className="font-medium">{severity}</dd>
              </div>
              {qe['reported_by'] ? (
                <div>
                  <dt className="text-gray-500">Reported By</dt>
                  <dd className="font-medium">{String(qe['reported_by'])}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-gray-500">Reported</dt>
                <dd className="font-medium">
                  {new Date(String(qe['created_at'])).toLocaleString()}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-gray-500">Description</dt>
                <dd className="mt-1 whitespace-pre-wrap">{String(qe['description'])}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="space-y-6">
          {qe['capa_id'] ? (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold">Linked CAPA</h2>
              </div>
              <div className="card-body">
                <Link
                  href={`/quality/capas/${String(qe['capa_id'])}`}
                  className="text-green-700 hover:underline"
                >
                  View CAPA → {String(qe['capa_id'])}
                </Link>
              </div>
            </div>
          ) : null}

          {linkedRecords.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold">Linked Records</h2>
              </div>
              <div className="card-body">
                <ul className="divide-y">
                  {linkedRecords.map((lr, i) => (
                    <li key={i} className="flex items-center justify-between py-2 text-sm">
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium">
                        {lr.record_type.replace(/_/g, ' ')}
                      </span>
                      <span className="font-mono text-gray-600">{lr.record_id}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <AuditTrailPanel events={auditEvents} />
        </div>
      </div>

      {status !== 'CLOSED' && (
        <div className="flex gap-3">
          {status === 'OPEN' && (
            <Link href={`/quality/quality-events/${id}/investigate`} className="btn btn-primary">
              Start Investigation
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
