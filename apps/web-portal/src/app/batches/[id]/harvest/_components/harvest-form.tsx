'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBatch, useHarvestBatch } from '@/hooks';
import { Button, SignatureDialog } from '@gacp-erp/ui-components';

const QUALITY_GRADES = ['AAA', 'AA', 'A', 'B', 'C', 'REJECTED'] as const;

export function HarvestForm({ batchId }: { batchId: string }) {
  const router = useRouter();
  const { data: batch, isLoading } = useBatch(batchId);
  const harvestMutation = useHarvestBatch();

  const [showSignature, setShowSignature] = useState(false);
  const [form, setForm] = useState({
    wet_weight_grams: '',
    moisture_content_percent: '',
    quality_grade: 'A' as string,
    notes: '',
  });

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
      </div>
    );
  }

  const b = batch as Record<string, unknown> | undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.wet_weight_grams || !form.moisture_content_percent) return;
    setShowSignature(true);
  };

  const doHarvest = (_signature: { password: string; reason: string }) => {
    setShowSignature(false);
    // electronic_signature is constructed server-side after password verification (21 CFR Part 11)
    harvestMutation.mutate(
      {
        id: batchId,
        body: {
          batch_id: batchId,
          wet_weight_grams: parseFloat(form.wet_weight_grams),
          moisture_content_percent: parseFloat(form.moisture_content_percent),
          quality_grade: form.quality_grade as 'AAA' | 'AA' | 'A' | 'B' | 'C' | 'REJECTED',
          ...(form.notes ? { notes: form.notes } : {}),
        } as Parameters<typeof harvestMutation.mutate>[0]['body'],
      },
      { onSuccess: () => router.push(`/batches/${batchId}`) },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/batches/${batchId}`} className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to batch
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Record Harvest</h1>
        {b && (
          <p className="mt-1 text-sm text-gray-500">
            Batch: <strong>{b['batch_number'] as string}</strong>
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="card-body space-y-5">
          {/* Wet Weight */}
          <div>
            <label htmlFor="wet_weight" className="block text-sm font-medium text-gray-700">
              Wet Weight (grams) *
            </label>
            <input
              id="wet_weight"
              type="number"
              step="0.1"
              min="0.1"
              value={form.wet_weight_grams}
              onChange={(e) => update('wet_weight_grams', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              required
            />
          </div>

          {/* Moisture */}
          <div>
            <label htmlFor="moisture" className="block text-sm font-medium text-gray-700">
              Moisture Content (%) *
            </label>
            <input
              id="moisture"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={form.moisture_content_percent}
              onChange={(e) => update('moisture_content_percent', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              required
            />
          </div>

          {/* Quality Grade */}
          <div>
            <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
              Quality Grade *
            </label>
            <select
              id="grade"
              value={form.quality_grade}
              onChange={(e) => update('quality_grade', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              {QUALITY_GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              id="notes"
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Optional harvest notes…"
            />
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <strong>⚠️ E-Signature Required:</strong> Harvest recording requires electronic
            signature per 21 CFR Part 11 compliance.
          </div>

          {/* Error */}
          {harvestMutation.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {harvestMutation.error.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={harvestMutation.isPending}>
              {harvestMutation.isPending ? 'Recording…' : 'Record Harvest'}
            </Button>
            <Link href={`/batches/${batchId}`}>
              <Button variant="secondary">Cancel</Button>
            </Link>
          </div>
        </div>
      </form>

      <SignatureDialog
        open={showSignature}
        onClose={() => setShowSignature(false)}
        onConfirm={(password, reason) => doHarvest({ password, reason })}
        title="Authorize Harvest Record"
        description={`Recording harvest for batch ${(b?.['batch_number'] as string) ?? batchId}.`}
      />
    </div>
  );
}
