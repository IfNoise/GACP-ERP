'use client';

import Link from 'next/link';
import { usePlant, usePlantStageHistory } from '@/hooks';
import { WorkflowTimeline, AuditTrailPanel, StatusBadge, Button } from '@gacp-erp/ui-components';
import type { WorkflowStep, AuditEvent } from '@gacp-erp/ui-components';

const GROWTH_STAGES = [
  'SEED',
  'GERMINATION',
  'CLONING',
  'VEGETATIVE',
  'MOTHER_PLANT',
  'FLOWERING',
  'HARVESTING',
  'HARVESTED',
  'DESTROYED',
] as const;

const stageVariant: Record<
  string,
  'draft' | 'pending' | 'active' | 'approved' | 'closed' | 'rejected'
> = {
  SEED: 'draft',
  GERMINATION: 'pending',
  CLONING: 'pending',
  VEGETATIVE: 'active',
  MOTHER_PLANT: 'active',
  FLOWERING: 'approved',
  HARVESTING: 'pending',
  HARVESTED: 'closed',
  DESTROYED: 'rejected',
};

interface StageRecord {
  id: string;
  stage: string;
  started_at: string;
  notes?: string;
  recorded_by?: string;
}

export function PlantDetail({ id }: { id: string }) {
  const { data: plant, isLoading, isError } = usePlant(id);
  const { data: stageHistory } = usePlantStageHistory(id);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
      </div>
    );
  }

  if (isError || !plant) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-600">Failed to load plant details.</p>
        <Link href="/plants" className="mt-2 inline-block text-sm text-green-700 underline">
          ← Back to plants
        </Link>
      </div>
    );
  }

  const p = plant as Record<string, unknown>;
  const currentStage = (p['current_stage'] as string) ?? 'SEED';
  const currentStageIdx = GROWTH_STAGES.indexOf(currentStage as (typeof GROWTH_STAGES)[number]);

  const timelineSteps: WorkflowStep[] = GROWTH_STAGES.filter((s) => s !== 'DESTROYED').map(
    (stage, idx) => ({
      id: stage,
      label: stage.charAt(0) + stage.slice(1).toLowerCase().replace('_', ' '),
      status:
        stage === currentStage
          ? ('active' as const)
          : idx < currentStageIdx
            ? ('completed' as const)
            : ('pending' as const),
    }),
  );

  const history = (stageHistory as unknown as StageRecord[]) ?? [];
  const auditEvents: AuditEvent[] = history.map((h) => ({
    id: h.id,
    action: `Stage → ${h.stage}`,
    actor: h.recorded_by ?? 'System',
    timestamp: h.started_at,
    ...(h.notes != null ? { details: h.notes } : {}),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/plants" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to plants
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{String(p['plant_code'])}</h1>
          <div className="mt-2 flex items-center gap-3">
            <StatusBadge status={stageVariant[currentStage] ?? 'draft'} label={currentStage} />
            {p['health_score'] != null && (
              <span className="text-sm text-gray-600">
                Health: <strong>{p['health_score'] as number}%</strong>
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/plants/${id}/transition`}>
            <Button>Transition Stage</Button>
          </Link>
        </div>
      </div>

      {/* Stage Timeline */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Growth Timeline</h2>
        </div>
        <div className="card-body">
          <WorkflowTimeline steps={timelineSteps} />
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900">Plant Information</h3>
          </div>
          <div className="card-body">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Plant Code</dt>
                <dd className="font-medium text-gray-900">{String(p['plant_code'])}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Batch</dt>
                <dd>
                  <Link
                    href={`/batches/${String(p['batch_id'])}`}
                    className="font-medium text-green-700 hover:underline"
                  >
                    {String(p['batch_id'])}
                  </Link>
                </dd>
              </div>
              {p['zone_id'] ? (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Zone</dt>
                  <dd className="font-medium text-gray-900">{String(p['zone_id'])}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-gray-500">Created</dt>
                <dd className="text-gray-900">
                  {new Date(String(p['created_at'])).toLocaleString()}
                </dd>
              </div>
              {p['notes'] ? (
                <div>
                  <dt className="text-gray-500">Notes</dt>
                  <dd className="mt-1 text-gray-900">{String(p['notes'])}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>

        {/* QR Code placeholder */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900">QR Code</h3>
          </div>
          <div className="card-body flex items-center justify-center">
            <div className="flex h-40 w-40 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-sm text-gray-400">
              QR Code
            </div>
          </div>
        </div>
      </div>

      {/* Stage History (Audit Trail) */}
      <AuditTrailPanel events={auditEvents} title="Stage History" />
    </div>
  );
}
