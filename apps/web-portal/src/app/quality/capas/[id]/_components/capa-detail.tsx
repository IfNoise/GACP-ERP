'use client';

import Link from 'next/link';
import { useCAPA } from '@/hooks';
import { StatusBadge, WorkflowTimeline, AuditTrailPanel } from '@gacp-erp/ui-components';
import type { StatusVariant, WorkflowStep, AuditEvent } from '@gacp-erp/ui-components';

const CAPA_STAGES = [
  'OPEN',
  'RCA_IN_PROGRESS',
  'ACTION_PLAN',
  'IMPLEMENTING',
  'EFFECTIVENESS_CHECK',
  'CLOSED',
] as const;

const STATUS_VARIANT: Record<string, StatusVariant> = {
  OPEN: 'active',
  RCA_IN_PROGRESS: 'pending',
  ACTION_PLAN: 'pending',
  IMPLEMENTING: 'active',
  EFFECTIVENESS_CHECK: 'pending',
  CLOSED: 'closed',
};

const RCA_CATEGORIES: Record<string, string> = {
  HUMAN_ERROR: 'Human Error',
  PROCESS_FAILURE: 'Process Failure',
  EQUIPMENT_FAILURE: 'Equipment Failure',
  MATERIAL_DEFECT: 'Material Defect',
  ENVIRONMENTAL: 'Environmental',
  DOCUMENTATION: 'Documentation',
  TRAINING_GAP: 'Training Gap',
  SYSTEM_FAILURE: 'System Failure',
  UNKNOWN: 'Unknown',
};

export function CAPADetail({ id }: { id: string }) {
  const { data, isLoading } = useCAPA(id);

  if (isLoading) return <div className="animate-pulse p-6">Loading CAPA...</div>;
  if (!data) return <div className="p-6 text-red-600">CAPA not found</div>;

  const c = data as Record<string, unknown>;
  const status = String(c['status']);

  const steps: WorkflowStep[] = CAPA_STAGES.map((stage) => {
    const idx = CAPA_STAGES.indexOf(stage);
    const currentIdx = CAPA_STAGES.indexOf(status as (typeof CAPA_STAGES)[number]);
    let stepStatus: 'completed' | 'active' | 'pending' = 'pending';
    if (idx < currentIdx) stepStatus = 'completed';
    else if (idx === currentIdx) stepStatus = 'active';
    return { id: stage, label: stage.replace(/_/g, ' '), status: stepStatus };
  });

  const auditEvents: AuditEvent[] = [
    {
      id: 'created',
      action: 'Created',
      actor: String(c['created_by'] ?? ''),
      timestamp: String(c['created_at']),
    },
    ...(String(c['updated_at']) !== String(c['created_at'])
      ? [
          {
            id: 'updated',
            action: 'Updated',
            actor: String(c['updated_by'] ?? ''),
            timestamp: String(c['updated_at']),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/quality/capas" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to CAPAs
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{String(c['capa_number'])}</h1>
          <StatusBadge
            status={STATUS_VARIANT[status] ?? 'draft'}
            label={status.replace(/_/g, ' ')}
          />
          <StatusBadge
            status={String(c['type']) === 'CORRECTIVE' ? 'overdue' : 'pending'}
            label={String(c['type'])}
          />
        </div>
        <p className="mt-1 text-lg text-gray-700">{String(c['title'])}</p>
      </div>

      <WorkflowTimeline steps={steps} />

      {/* Actions */}
      <div className="flex gap-3">
        {status === 'OPEN' && (
          <Link href={`/quality/capas/${id}/rca`} className="btn btn-primary">
            Initiate RCA
          </Link>
        )}
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
                <dt className="text-gray-500">Source</dt>
                <dd className="font-medium">{String(c['source'])}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Assigned To</dt>
                <dd className="font-medium">{String(c['assigned_to'] ?? '—')}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Due Date</dt>
                <dd className="font-medium">
                  {c['due_date'] ? new Date(String(c['due_date'])).toLocaleDateString() : '—'}
                </dd>
              </div>
              {c['root_cause_category'] ? (
                <div>
                  <dt className="text-gray-500">Root Cause</dt>
                  <dd className="font-medium">
                    {RCA_CATEGORIES[String(c['root_cause_category'])] ??
                      String(c['root_cause_category'])}
                  </dd>
                </div>
              ) : null}
              <div className="col-span-2">
                <dt className="text-gray-500">Description</dt>
                <dd className="mt-1 whitespace-pre-wrap">{String(c['description'])}</dd>
              </div>
              {c['source_record_id'] ? (
                <div className="col-span-2">
                  <dt className="text-gray-500">Source Record</dt>
                  <dd className="font-medium">
                    {String(c['source_record_type'])}: {String(c['source_record_id'])}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>

        <AuditTrailPanel events={auditEvents} />
      </div>
    </div>
  );
}
