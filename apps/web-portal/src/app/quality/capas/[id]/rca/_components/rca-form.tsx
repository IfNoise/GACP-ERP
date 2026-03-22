'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCAPA, useInitiateRca } from '@/hooks';

const ROOT_CAUSE_CATEGORIES = [
  'HUMAN_ERROR',
  'PROCESS_FAILURE',
  'EQUIPMENT_FAILURE',
  'MATERIAL_DEFECT',
  'ENVIRONMENTAL',
  'DOCUMENTATION',
  'TRAINING_GAP',
  'SYSTEM_FAILURE',
  'UNKNOWN',
] as const;

export function RCAForm({ id }: { id: string }) {
  const router = useRouter();
  const { data } = useCAPA(id);
  const initRca = useInitiateRca();
  const [form, setForm] = useState({
    root_cause_category: 'UNKNOWN',
    root_cause_description: '',
    contributing_factors: '',
    immediate_actions_taken: '',
  });

  const c = data as Record<string, unknown> | undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    initRca.mutate(
      {
        id,
        body: {
          root_cause_category: form.root_cause_category,
          root_cause_description: form.root_cause_description,
          ...(form.contributing_factors
            ? {
                contributing_factors: form.contributing_factors
                  .split('\n')
                  .map((s) => s.trim())
                  .filter(Boolean),
              }
            : {}),
          ...(form.immediate_actions_taken
            ? { immediate_actions_taken: form.immediate_actions_taken }
            : {}),
        } as Parameters<typeof initRca.mutate>[0]['body'],
      },
      { onSuccess: () => router.push(`/quality/capas/${id}`) },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/quality/capas/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to {c ? String(c['capa_number']) : 'CAPA'}
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Root Cause Analysis</h1>
        <p className="mt-1 text-sm text-gray-500">
          5-Why / Fishbone analysis for CAPA investigation
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card max-w-2xl">
        <div className="card-body space-y-4">
          <div>
            <label className="label">Root Cause Category</label>
            <select
              className="input w-full"
              value={form.root_cause_category}
              onChange={(e) => setForm((f) => ({ ...f, root_cause_category: e.target.value }))}
            >
              {ROOT_CAUSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Root Cause Description (min 10 chars)</label>
            <textarea
              className="input w-full"
              rows={5}
              value={form.root_cause_description}
              onChange={(e) => setForm((f) => ({ ...f, root_cause_description: e.target.value }))}
              required
              minLength={10}
              placeholder="Describe the root cause analysis findings..."
            />
          </div>
          <div>
            <label className="label">Contributing Factors (optional)</label>
            <textarea
              className="input w-full"
              rows={3}
              value={form.contributing_factors}
              onChange={(e) => setForm((f) => ({ ...f, contributing_factors: e.target.value }))}
              placeholder="Additional contributing factors..."
            />
          </div>
          <div>
            <label className="label">Immediate Actions Taken (optional)</label>
            <textarea
              className="input w-full"
              rows={3}
              value={form.immediate_actions_taken}
              onChange={(e) => setForm((f) => ({ ...f, immediate_actions_taken: e.target.value }))}
              placeholder="What immediate actions were taken..."
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn btn-primary" disabled={initRca.isPending}>
              {initRca.isPending ? 'Submitting...' : 'Submit RCA'}
            </button>
            <Link href={`/quality/capas/${id}`} className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
