'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePlant, useTransitionPlantStage } from '@/hooks';
import { Button, SignatureDialog, StatusBadge } from '@gacp-erp/ui-components';

const VALID_TRANSITIONS: Readonly<Record<string, readonly string[]>> = {
  SEED: ['GERMINATION', 'DESTROYED'],
  GERMINATION: ['CLONING', 'VEGETATIVE', 'DESTROYED'],
  CLONING: ['VEGETATIVE', 'DESTROYED'],
  VEGETATIVE: ['FLOWERING', 'DESTROYED'],
  MOTHER_PLANT: ['VEGETATIVE', 'DESTROYED'],
  FLOWERING: ['HARVESTING', 'DESTROYED'],
  HARVESTING: ['HARVESTED', 'DESTROYED'],
  HARVESTED: [],
  DESTROYED: [],
};

const CRITICAL_STAGES = new Set(['FLOWERING', 'HARVESTING', 'HARVESTED', 'DESTROYED']);

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

export function StageTransitionForm({ plantId }: { plantId: string }) {
  const router = useRouter();
  const { data: plant, isLoading } = usePlant(plantId);
  const transition = useTransitionPlantStage();

  const [targetStage, setTargetStage] = useState('');
  const [notes, setNotes] = useState('');
  const [showSignature, setShowSignature] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-600">Plant not found.</p>
      </div>
    );
  }

  const p = plant as Record<string, unknown>;
  const currentStage = (p['current_stage'] as string) ?? 'SEED';
  const validTargets = VALID_TRANSITIONS[currentStage] ?? [];

  const handleSubmit = () => {
    if (!targetStage) return;

    if (CRITICAL_STAGES.has(targetStage)) {
      setShowSignature(true);
      return;
    }

    doTransition();
  };

  const doTransition = (_signature?: { password: string; reason: string }) => {
    transition.mutate(
      {
        id: plantId,
        body: {
          target_stage: targetStage as
            | 'SEED'
            | 'GERMINATION'
            | 'CLONING'
            | 'VEGETATIVE'
            | 'MOTHER_PLANT'
            | 'FLOWERING'
            | 'HARVESTING'
            | 'HARVESTED'
            | 'DESTROYED',
          ...(notes ? { notes } : {}),
        },
      },
      { onSuccess: () => router.push(`/plants/${plantId}`) },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/plants/${plantId}`} className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to plant
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Stage Transition</h1>
        <p className="mt-1 text-sm text-gray-500">
          Plant: <strong>{p['plant_code'] as string}</strong>
        </p>
      </div>

      <div className="card">
        <div className="card-body space-y-6">
          {/* Current Stage */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Stage</label>
            <div className="mt-1">
              <StatusBadge status={stageVariant[currentStage] ?? 'draft'} label={currentStage} />
            </div>
          </div>

          {/* Target Stage */}
          <div>
            <label htmlFor="target_stage" className="block text-sm font-medium text-gray-700">
              Target Stage
            </label>
            {validTargets.length === 0 ? (
              <p className="mt-1 text-sm text-gray-500">
                No further transitions available from {currentStage}.
              </p>
            ) : (
              <select
                id="target_stage"
                value={targetStage}
                onChange={(e) => setTargetStage(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="">Select target stage…</option>
                {validTargets.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                    {CRITICAL_STAGES.has(stage) ? ' ⚠️ (requires e-signature)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Optional transition notes…"
            />
          </div>

          {/* Critical stage warning */}
          {targetStage && CRITICAL_STAGES.has(targetStage) && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <strong>⚠️ Critical Transition:</strong> Transitioning to {targetStage} requires
              electronic signature per 21 CFR Part 11 compliance.
            </div>
          )}

          {/* Error */}
          {transition.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {transition.error.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={handleSubmit} disabled={!targetStage || transition.isPending}>
              {transition.isPending ? 'Transitioning…' : 'Confirm Transition'}
            </Button>
            <Link href={`/plants/${plantId}`}>
              <Button variant="secondary">Cancel</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Signature Dialog */}
      <SignatureDialog
        open={showSignature}
        onClose={() => setShowSignature(false)}
        onConfirm={(password, reason) => {
          setShowSignature(false);
          doTransition({ password, reason });
        }}
        title="Authorize Stage Transition"
        description={`Transitioning plant ${p['plant_code'] as string} from ${currentStage} to ${targetStage}.`}
      />
    </div>
  );
}
