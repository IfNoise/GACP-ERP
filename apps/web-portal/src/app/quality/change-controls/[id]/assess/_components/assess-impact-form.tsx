'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useChangeControl, useAssessImpact } from '@/hooks';

const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

interface ImpactRow {
  area: string;
  impact_description: string;
  risk_level: string;
}

export function AssessImpactForm({ id }: { id: string }) {
  const router = useRouter();
  const { data } = useChangeControl(id);
  const assess = useAssessImpact();
  const [impacts, setImpacts] = useState<ImpactRow[]>([
    { area: '', impact_description: '', risk_level: 'LOW' },
  ]);

  const cc = data as Record<string, unknown> | undefined;

  const addRow = () =>
    setImpacts((prev) => [...prev, { area: '', impact_description: '', risk_level: 'LOW' }]);

  const updateRow = (idx: number, field: keyof ImpactRow, value: string) => {
    setImpacts((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const removeRow = (idx: number) => {
    if (impacts.length > 1) setImpacts((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = impacts.every((r) => r.area && r.impact_description);
    if (!valid) return;
    assess.mutate(
      { id, body: { impacts } as Parameters<typeof assess.mutate>[0]['body'] },
      { onSuccess: () => router.push(`/quality/change-controls/${id}`) },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/quality/change-controls/${id}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to {cc ? String(cc['ccn_number']) : 'change control'}
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Impact Assessment</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {impacts.map((row, idx) => (
          <div key={idx} className="card">
            <div className="card-body space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Impact #{idx + 1}</h3>
                {impacts.length > 1 && (
                  <button
                    type="button"
                    className="text-sm text-red-600 hover:underline"
                    onClick={() => removeRow(idx)}
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Area</label>
                  <input
                    className="input w-full"
                    value={row.area}
                    onChange={(e) => updateRow(idx, 'area', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label">Risk Level</label>
                  <select
                    className="input w-full"
                    value={row.risk_level}
                    onChange={(e) => updateRow(idx, 'risk_level', e.target.value)}
                  >
                    {RISK_LEVELS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Impact Description</label>
                <textarea
                  className="input w-full"
                  rows={3}
                  value={row.impact_description}
                  onChange={(e) => updateRow(idx, 'impact_description', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        ))}

        <button type="button" className="btn btn-secondary" onClick={addRow}>
          + Add Impact
        </button>

        <div className="flex gap-3">
          <button type="submit" className="btn btn-primary" disabled={assess.isPending}>
            {assess.isPending ? 'Submitting...' : 'Submit Assessment'}
          </button>
          <Link href={`/quality/change-controls/${id}`} className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
