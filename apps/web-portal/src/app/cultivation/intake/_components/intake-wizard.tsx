'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, ZonePicker } from '@gacp-erp/ui-components';
import type { ZoneNode } from '@gacp-erp/ui-components';
import {
  useCreateBatch,
  useBulkCreatePlants,
  useStrains,
  useBatches,
  useZoneTree,
  useFacilities,
} from '@/hooks';

// ─── Types ────────────────────────────────────────────────────────────────────

type BatchSourceType = 'external_purchase' | 'internal_clone' | 'seed_bank' | 'tissue_culture';
type PlantSourceType = 'seed' | 'clone' | 'tissue_culture';

interface BatchForm {
  batch_number: string;
  strain_id: string;
  facility_id: string;
  planned_plant_count: string;
  batch_source_type: BatchSourceType;
  source_grn_id: string;
  source_batch_id: string;
  planned_start_date: string;
  planned_harvest_date: string;
  notes: string;
}

interface PlantsForm {
  zone_id: string;
  source_type: PlantSourceType;
  plant_code_prefix: string;
  count: string;
  notes: string;
}

interface SuccessState {
  batchId: string;
  batchNumber: string;
  plantCount: number;
}

// ─── Source type config ───────────────────────────────────────────────────────

const SOURCE_TYPES: { value: BatchSourceType; label: string; description: string }[] = [
  {
    value: 'seed_bank',
    label: 'Seed Bank',
    description: 'Seeds from our own stock',
  },
  {
    value: 'internal_clone',
    label: 'Internal Clone',
    description: 'Cuttings from our mother plants',
  },
  {
    value: 'external_purchase',
    label: 'External Purchase',
    description: 'Seeds or clones from a supplier (GRN required)',
  },
  {
    value: 'tissue_culture',
    label: 'Tissue Culture',
    description: 'TC lab propagation',
  },
];

const PLANT_SOURCE_TYPES: { value: PlantSourceType; label: string }[] = [
  { value: 'seed', label: 'Seed' },
  { value: 'clone', label: 'Clone' },
  { value: 'tissue_culture', label: 'Tissue Culture' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function derivePrefixFromBatchNumber(batchNumber: string): string {
  // BATCH-2026-001 → B2026; CLN-2026-007 → CLN26; fallback to first 8 alphanum chars
  const parts = batchNumber
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .split('-');
  if (parts.length >= 2) {
    const first = parts[0] ?? '';
    const second = parts[1] ?? '';
    // Keep first part (max 4) + last 2 chars of second part
    const yearSuffix = second.slice(-2);
    return (first.slice(0, 4) + yearSuffix).replace(/[^A-Z0-9]/g, '').slice(0, 10);
  }
  return batchNumber.replace(/[^A-Z0-9]/g, '').slice(0, 10);
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { readonly step: 1 | 2 }) {
  const steps = ['Create Batch', 'Assign to Zone'];
  return (
    <div className="mb-6 flex items-center gap-3">
      {steps.map((label, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && <div className="h-px w-8 bg-gray-300" />}
            <div className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold
                  ${active ? 'bg-brand-600 text-white' : done ? 'bg-brand-100 text-brand-700' : 'bg-gray-200 text-gray-500'}`}
              >
                {done ? '✓' : n}
              </div>
              <span
                className={`text-sm font-medium ${active ? 'text-brand-700' : 'text-gray-500'}`}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Batch Form ───────────────────────────────────────────────────────

function BatchStep({
  onSuccess,
}: {
  readonly onSuccess: (
    batchId: string,
    batchNumber: string,
    plannedCount: number,
    strainId: string,
  ) => void;
}) {
  const createBatch = useCreateBatch();
  const { data: strainsData } = useStrains({ is_active: 'true', limit: 100 } as Parameters<
    typeof useStrains
  >[0]);
  const { data: facilitiesData } = useFacilities({ limit: 100 });
  const { data: batchesData } = useBatches({ limit: 200 });

  const strains = (strainsData as { data?: unknown[] } | undefined)?.data ?? [];
  const facilities = (facilitiesData as { data?: unknown[] } | undefined)?.data ?? [];
  const allBatches = (batchesData as { data?: unknown[] } | undefined)?.data ?? [];

  const [form, setForm] = useState<BatchForm>({
    batch_number: '',
    strain_id: '',
    facility_id: '',
    planned_plant_count: '100',
    batch_source_type: 'seed_bank',
    source_grn_id: '',
    source_batch_id: '',
    planned_start_date: '',
    planned_harvest_date: '',
    notes: '',
  });

  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof BatchForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // Filter batches to same strain for internal_clone picker
  const motherBatches = allBatches.filter((b) => {
    const batch = b as { strain_id?: string; status?: string };
    return (
      batch.strain_id === form.strain_id &&
      (batch.status === 'ACTIVE' || batch.status === 'MOTHER_PLANT')
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.batch_number || !form.strain_id || !form.facility_id) {
      setError('Batch number, strain and facility are required.');
      return;
    }
    if (form.batch_source_type === 'external_purchase' && !form.source_grn_id) {
      setError('GRN ID is required for external purchase batches.');
      return;
    }
    if (form.batch_source_type === 'internal_clone' && !form.source_batch_id) {
      setError('Mother batch is required for internal clone batches.');
      return;
    }

    const plannedCount = parseInt(form.planned_plant_count, 10);
    if (isNaN(plannedCount) || plannedCount < 1) {
      setError('Planned plant count must be a positive integer.');
      return;
    }

    try {
      const body = {
        batch_number: form.batch_number.toUpperCase(),
        strain_id: form.strain_id,
        facility_id: form.facility_id,
        planned_plant_count: plannedCount,
        batch_source_type: form.batch_source_type,
        ...(form.source_grn_id ? { source_grn_id: form.source_grn_id } : {}),
        ...(form.source_batch_id ? { source_batch_id: form.source_batch_id } : {}),
        ...(form.planned_start_date
          ? { planned_start_date: new Date(form.planned_start_date).toISOString() }
          : {}),
        ...(form.planned_harvest_date
          ? { planned_harvest_date: new Date(form.planned_harvest_date).toISOString() }
          : {}),
        ...(form.notes ? { notes: form.notes } : {}),
      } as Parameters<typeof createBatch.mutateAsync>[0];

      const result = await createBatch.mutateAsync(body);
      const created = result as { id: string; batch_number: string; strain_id: string };
      onSuccess(created.id, created.batch_number, plannedCount, created.strain_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create batch');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <div className="card-body space-y-5">
        {/* Row: Batch number + Facility */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Batch Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.batch_number}
              onChange={(e) => set('batch_number', e.target.value)}
              placeholder="BATCH-2026-001"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Facility <span className="text-red-500">*</span>
            </label>
            <select
              value={form.facility_id}
              onChange={(e) => set('facility_id', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
            >
              <option value="">Select facility…</option>
              {(facilities as { id: string; name: string }[]).map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row: Strain + Planned count */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Strain <span className="text-red-500">*</span>
            </label>
            <select
              value={form.strain_id}
              onChange={(e) => {
                set('strain_id', e.target.value);
                set('source_batch_id', ''); // reset mother batch when strain changes
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
            >
              <option value="">Select strain…</option>
              {(strains as { id: string; name: string }[]).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Planned Plant Count <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={100000}
              value={form.planned_plant_count}
              onChange={(e) => set('planned_plant_count', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
            />
          </div>
        </div>

        {/* Source type pills */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Batch Source</label>
          <div className="flex flex-wrap gap-2">
            {SOURCE_TYPES.map((s) => (
              <Button
                key={s.value}
                type="button"
                variant={form.batch_source_type === s.value ? 'default' : 'secondary'}
                onClick={() => {
                  set('batch_source_type', s.value);
                  set('source_grn_id', '');
                  set('source_batch_id', '');
                }}
                title={s.description}
              >
                {s.label}
              </Button>
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {SOURCE_TYPES.find((s) => s.value === form.batch_source_type)?.description}
          </p>
        </div>

        {/* Conditional source fields */}
        {(form.batch_source_type === 'external_purchase' ||
          form.batch_source_type === 'tissue_culture') && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              GRN ID (Goods Receipt Note)
              {form.batch_source_type === 'external_purchase' && (
                <span className="text-red-500"> *</span>
              )}
            </label>
            <input
              type="text"
              value={form.source_grn_id}
              onChange={(e) => set('source_grn_id', e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              UUID of the receiving record from{' '}
              <Link href="/procurement/receiving" className="text-brand-600 hover:underline">
                Procurement → Receiving
              </Link>
            </p>
          </div>
        )}

        {form.batch_source_type === 'internal_clone' && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Mother Batch <span className="text-red-500">*</span>
            </label>
            {!form.strain_id ? (
              <p className="text-sm text-gray-500">
                Select a strain first to see available batches.
              </p>
            ) : motherBatches.length === 0 ? (
              <p className="text-sm text-amber-600">
                No active batches found for the selected strain. Activate a batch first.
              </p>
            ) : (
              <select
                value={form.source_batch_id}
                onChange={(e) => set('source_batch_id', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                required
              >
                <option value="">Select mother batch…</option>
                {(motherBatches as { id: string; batch_number: string }[]).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batch_number}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Planned Start Date
            </label>
            <input
              type="date"
              value={form.planned_start_date}
              onChange={(e) => set('planned_start_date', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Planned Harvest Date
            </label>
            <input
              type="date"
              value={form.planned_harvest_date}
              onChange={(e) => set('planned_harvest_date', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={3}
            maxLength={2000}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Link
            href="/batches"
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </Link>
          <Button type="submit" disabled={createBatch.isPending}>
            {createBatch.isPending ? 'Creating…' : 'Create Batch →'}
          </Button>
        </div>
      </div>
    </form>
  );
}

// ─── Step 2: Plants Form ──────────────────────────────────────────────────────

function PlantsStep({
  batchId,
  batchNumber,
  plannedCount,
  strainId,
  onSuccess,
}: {
  readonly batchId: string;
  readonly batchNumber: string;
  readonly plannedCount: number;
  readonly strainId: string;
  readonly onSuccess: (count: number) => void;
}) {
  const bulkCreate = useBulkCreatePlants();
  const { data: zoneTree, isLoading: zonesLoading, error: zonesError } = useZoneTree(true);

  const [form, setForm] = useState<PlantsForm>({
    zone_id: '',
    source_type: 'seed',
    plant_code_prefix: derivePrefixFromBatchNumber(batchNumber),
    count: String(plannedCount),
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof PlantsForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.zone_id) {
      setError('Zone is required.');
      return;
    }
    if (!form.plant_code_prefix) {
      setError('Plant code prefix is required.');
      return;
    }

    const count = parseInt(form.count, 10);
    if (isNaN(count) || count < 1 || count > 10000) {
      setError('Count must be between 1 and 10 000.');
      return;
    }

    try {
      const result = await bulkCreate.mutateAsync({
        batch_id: batchId,
        strain_id: strainId,
        zone_id: form.zone_id,
        source_type: form.source_type,
        plant_code_prefix: form.plant_code_prefix.toUpperCase(),
        count,
        ...(form.notes ? { notes: form.notes } : {}),
      } as Parameters<typeof bulkCreate.mutateAsync>[0]);

      onSuccess((result as { created?: number }).created ?? count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create plants');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <div className="card-body space-y-5">
        {/* Batch banner */}
        <div className="rounded-lg bg-brand-50 px-4 py-3">
          <p className="text-sm text-brand-700">
            Batch created:{' '}
            <Link href={`/batches/${batchId}`} className="font-semibold hover:underline">
              {batchNumber}
            </Link>
          </p>
        </div>

        {/* Zone */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Zone <span className="text-red-500">*</span>
          </label>
          <ZonePicker
            value={form.zone_id}
            onChange={(zoneId: string, _zone: ZoneNode) => set('zone_id', zoneId)}
            zones={zoneTree ?? []}
            isLoading={zonesLoading}
            error={zonesError ? 'Failed to load zones' : null}
            showOccupancy
            placeholder="Select zone…"
          />
        </div>

        {/* Source type pills */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Plant Source Type</label>
          <div className="flex gap-2">
            {PLANT_SOURCE_TYPES.map((s) => (
              <Button
                key={s.value}
                type="button"
                variant={form.source_type === s.value ? 'default' : 'secondary'}
                onClick={() => set('source_type', s.value)}
              >
                {s.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Prefix + Count */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Plant Code Prefix <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.plant_code_prefix}
              onChange={(e) => set('plant_code_prefix', e.target.value.toUpperCase())}
              maxLength={12}
              pattern="[-A-Z0-9]+"
              placeholder="BATCH26"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm uppercase focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Plants will be named {form.plant_code_prefix || 'PREFIX'}-0001, -0002, …
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Number of Plants <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={10000}
              value={form.count}
              onChange={(e) => set('count', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={2}
            maxLength={2000}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button type="submit" disabled={bulkCreate.isPending}>
            {bulkCreate.isPending ? 'Creating plants…' : 'Create Plants'}
          </Button>
        </div>
      </div>
    </form>
  );
}

// ─── Success ──────────────────────────────────────────────────────────────────

function SuccessView({ state }: { readonly state: SuccessState }) {
  const router = useRouter();
  return (
    <div className="card">
      <div className="card-body space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-3xl">
          ✓
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Intake Complete</h2>
          <p className="text-sm text-gray-500">
            Batch <strong>{state.batchNumber}</strong> created with{' '}
            <strong>
              {state.plantCount} plant{state.plantCount !== 1 ? 's' : ''}
            </strong>
            .
          </p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href={`/batches/${state.batchId}`}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            View Batch
          </Link>
          <Link
            href="/plants"
            className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            View Plants
          </Link>
          <Button type="button" variant="ghost" onClick={() => router.push('/cultivation/intake')}>
            New Intake
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Wizard ───────────────────────────────────────────────────────────────────

export function IntakeWizard() {
  const [step, setStep] = useState<1 | 2>(1);
  const [batchInfo, setBatchInfo] = useState<{
    id: string;
    number: string;
    plannedCount: number;
    strainId: string;
  } | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  if (success) {
    return <SuccessView state={success} />;
  }

  return (
    <div className="space-y-4">
      <StepIndicator step={step} />

      {step === 1 && (
        <BatchStep
          onSuccess={(batchId, batchNumber, plannedCount, strainId) => {
            setBatchInfo({ id: batchId, number: batchNumber, plannedCount, strainId });
            setStep(2);
          }}
        />
      )}

      {step === 2 && batchInfo && (
        <PlantsStep
          batchId={batchInfo.id}
          batchNumber={batchInfo.number}
          plannedCount={batchInfo.plannedCount}
          strainId={batchInfo.strainId}
          onSuccess={(plantCount) =>
            setSuccess({ batchId: batchInfo.id, batchNumber: batchInfo.number, plantCount })
          }
        />
      )}
    </div>
  );
}
