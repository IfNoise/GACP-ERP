'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreateStrain } from '@/hooks';
import { Button } from '@gacp-erp/ui-components';

const SPECIES_OPTIONS = [
  { value: 'Cannabis sativa', label: 'Cannabis sativa' },
  { value: 'Cannabis indica', label: 'Cannabis indica' },
  { value: 'Cannabis ruderalis', label: 'Cannabis ruderalis' },
  { value: 'hybrid', label: 'Hybrid' },
] as const;

const SOURCE_TYPE_OPTIONS = [
  { value: 'seed', label: 'Seed' },
  { value: 'clone', label: 'Clone' },
  { value: 'tissue_culture', label: 'Tissue Culture' },
] as const;

export function CreateStrainForm() {
  const router = useRouter();
  const createStrain = useCreateStrain();

  const [form, setForm] = useState({
    name: '',
    cultivar_code: '',
    species: 'hybrid',
    genetics: '',
    thc_percentage_min: '',
    thc_percentage_max: '',
    cbd_percentage_min: '',
    cbd_percentage_max: '',
    flowering_time_days_min: '',
    flowering_time_days_max: '',
    expected_yield_grams_min: '',
    expected_yield_grams_max: '',
    notes: '',
    certificate_url: '',
    breeder: '',
    seed_bank: '',
    source_type: 'seed',
    dna_profile_url: '',
    acquisition_cost: '',
    currency: 'EUR',
    cost_per_unit: '',
    unit_type: '',
    quarantine_days: '',
    stability_verified: false,
    registration_number: '',
  });

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.cultivar_code) return;

    createStrain.mutate(
      {
        name: form.name,
        cultivar_code: form.cultivar_code,
        species: form.species as
          | 'Cannabis sativa'
          | 'Cannabis indica'
          | 'Cannabis ruderalis'
          | 'hybrid',
        source_type: form.source_type as 'seed' | 'clone' | 'tissue_culture',
        ...(form.genetics ? { genetics: form.genetics } : {}),
        ...(form.thc_percentage_min
          ? { thc_percentage_min: parseFloat(form.thc_percentage_min) }
          : {}),
        ...(form.thc_percentage_max
          ? { thc_percentage_max: parseFloat(form.thc_percentage_max) }
          : {}),
        ...(form.cbd_percentage_min
          ? { cbd_percentage_min: parseFloat(form.cbd_percentage_min) }
          : {}),
        ...(form.cbd_percentage_max
          ? { cbd_percentage_max: parseFloat(form.cbd_percentage_max) }
          : {}),
        ...(form.flowering_time_days_min
          ? { flowering_time_days_min: parseInt(form.flowering_time_days_min, 10) }
          : {}),
        ...(form.flowering_time_days_max
          ? { flowering_time_days_max: parseInt(form.flowering_time_days_max, 10) }
          : {}),
        ...(form.expected_yield_grams_min
          ? { expected_yield_grams_min: parseFloat(form.expected_yield_grams_min) }
          : {}),
        ...(form.expected_yield_grams_max
          ? { expected_yield_grams_max: parseFloat(form.expected_yield_grams_max) }
          : {}),
        ...(form.notes ? { notes: form.notes } : {}),
        ...(form.certificate_url ? { certificate_url: form.certificate_url } : {}),
        ...(form.breeder ? { breeder: form.breeder } : {}),
        ...(form.seed_bank ? { seed_bank: form.seed_bank } : {}),
        ...(form.dna_profile_url ? { dna_profile_url: form.dna_profile_url } : {}),
        ...(form.acquisition_cost ? { acquisition_cost: parseFloat(form.acquisition_cost) } : {}),
        ...(form.currency !== 'EUR' ? { currency: form.currency } : {}),
        ...(form.cost_per_unit ? { cost_per_unit: parseFloat(form.cost_per_unit) } : {}),
        ...(form.unit_type ? { unit_type: form.unit_type } : {}),
        ...(form.quarantine_days ? { quarantine_days: parseInt(form.quarantine_days, 10) } : {}),
        ...(form.stability_verified ? { stability_verified: true } : {}),
        ...(form.registration_number ? { registration_number: form.registration_number } : {}),
      },
      { onSuccess: () => router.push('/strains') },
    );
  };

  const inputClass =
    'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500';

  const sectionTitle = (title: string) => (
    <h3 className="border-b border-gray-200 pb-1 text-sm font-semibold text-gray-800">{title}</h3>
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href="/strains" className="text-sm text-gray-500 hover:text-gray-700">
          &larr; Back to strains
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Register New Strain</h1>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="card-body space-y-5">
          {/* ── Basic Info ── */}
          {sectionTitle('Basic Information')}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name *
              </label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="e.g. Northern Lights"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="cultivar_code" className="block text-sm font-medium text-gray-700">
                Cultivar Code *
              </label>
              <input
                id="cultivar_code"
                type="text"
                value={form.cultivar_code}
                onChange={(e) => update('cultivar_code', e.target.value.toUpperCase())}
                placeholder="e.g. NL-001"
                className={inputClass}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="species" className="block text-sm font-medium text-gray-700">
                Species
              </label>
              <select
                id="species"
                value={form.species}
                onChange={(e) => update('species', e.target.value)}
                className={inputClass}
              >
                {SPECIES_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="genetics" className="block text-sm font-medium text-gray-700">
                Genetics
              </label>
              <input
                id="genetics"
                type="text"
                value={form.genetics}
                onChange={(e) => update('genetics', e.target.value)}
                placeholder="e.g. Afghan x Thai"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="registration_number"
              className="block text-sm font-medium text-gray-700"
            >
              Registration Number
            </label>
            <input
              id="registration_number"
              type="text"
              value={form.registration_number}
              onChange={(e) => update('registration_number', e.target.value)}
              placeholder="e.g. EU/NL/2026-0042"
              className={inputClass}
            />
          </div>

          {/* ── Source & Breeder Traceability ── */}
          {sectionTitle('Source & Breeder Traceability')}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="source_type" className="block text-sm font-medium text-gray-700">
                Source Type
              </label>
              <select
                id="source_type"
                value={form.source_type}
                onChange={(e) => update('source_type', e.target.value)}
                className={inputClass}
              >
                {SOURCE_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="breeder" className="block text-sm font-medium text-gray-700">
                Breeder
              </label>
              <input
                id="breeder"
                type="text"
                value={form.breeder}
                onChange={(e) => update('breeder', e.target.value)}
                placeholder="e.g. Sensi Seeds"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="seed_bank" className="block text-sm font-medium text-gray-700">
                Seed Bank
              </label>
              <input
                id="seed_bank"
                type="text"
                value={form.seed_bank}
                onChange={(e) => update('seed_bank', e.target.value)}
                placeholder="e.g. Dutch Passion"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dna_profile_url" className="block text-sm font-medium text-gray-700">
                DNA Profile URL
              </label>
              <input
                id="dna_profile_url"
                type="url"
                value={form.dna_profile_url}
                onChange={(e) => update('dna_profile_url', e.target.value)}
                placeholder="https://..."
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="quarantine_days" className="block text-sm font-medium text-gray-700">
                Quarantine Days
              </label>
              <input
                id="quarantine_days"
                type="number"
                min="0"
                value={form.quarantine_days}
                onChange={(e) => update('quarantine_days', e.target.value)}
                placeholder="e.g. 14"
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="stability_verified"
              type="checkbox"
              checked={form.stability_verified}
              onChange={(e) => update('stability_verified', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <label htmlFor="stability_verified" className="text-sm font-medium text-gray-700">
              Genetic stability verified
            </label>
          </div>

          {/* ── Cannabinoid Profile ── */}
          {sectionTitle('Cannabinoid Profile')}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="thc_min" className="block text-sm font-medium text-gray-700">
                THC % Min
              </label>
              <input
                id="thc_min"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.thc_percentage_min}
                onChange={(e) => update('thc_percentage_min', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="thc_max" className="block text-sm font-medium text-gray-700">
                THC % Max
              </label>
              <input
                id="thc_max"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.thc_percentage_max}
                onChange={(e) => update('thc_percentage_max', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cbd_min" className="block text-sm font-medium text-gray-700">
                CBD % Min
              </label>
              <input
                id="cbd_min"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.cbd_percentage_min}
                onChange={(e) => update('cbd_percentage_min', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="cbd_max" className="block text-sm font-medium text-gray-700">
                CBD % Max
              </label>
              <input
                id="cbd_max"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.cbd_percentage_max}
                onChange={(e) => update('cbd_percentage_max', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* ── Growth Characteristics ── */}
          {sectionTitle('Growth Characteristics')}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="flower_min" className="block text-sm font-medium text-gray-700">
                Flowering Days Min
              </label>
              <input
                id="flower_min"
                type="number"
                min="1"
                value={form.flowering_time_days_min}
                onChange={(e) => update('flowering_time_days_min', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="flower_max" className="block text-sm font-medium text-gray-700">
                Flowering Days Max
              </label>
              <input
                id="flower_max"
                type="number"
                min="1"
                value={form.flowering_time_days_max}
                onChange={(e) => update('flowering_time_days_max', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="yield_min" className="block text-sm font-medium text-gray-700">
                Yield g/plant Min
              </label>
              <input
                id="yield_min"
                type="number"
                step="0.01"
                min="0"
                value={form.expected_yield_grams_min}
                onChange={(e) => update('expected_yield_grams_min', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="yield_max" className="block text-sm font-medium text-gray-700">
                Yield g/plant Max
              </label>
              <input
                id="yield_max"
                type="number"
                step="0.01"
                min="0"
                value={form.expected_yield_grams_max}
                onChange={(e) => update('expected_yield_grams_max', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* ── Cost & Acquisition ── */}
          {sectionTitle('Cost & Acquisition')}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="acquisition_cost" className="block text-sm font-medium text-gray-700">
                Acquisition Cost
              </label>
              <input
                id="acquisition_cost"
                type="number"
                step="0.01"
                min="0"
                value={form.acquisition_cost}
                onChange={(e) => update('acquisition_cost', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="cost_per_unit" className="block text-sm font-medium text-gray-700">
                Cost per Unit
              </label>
              <input
                id="cost_per_unit"
                type="number"
                step="0.01"
                min="0"
                value={form.cost_per_unit}
                onChange={(e) => update('cost_per_unit', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="unit_type" className="block text-sm font-medium text-gray-700">
                Unit Type
              </label>
              <input
                id="unit_type"
                type="text"
                value={form.unit_type}
                onChange={(e) => update('unit_type', e.target.value)}
                placeholder="e.g. seed, cutting"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
              Currency
            </label>
            <input
              id="currency"
              type="text"
              maxLength={3}
              value={form.currency}
              onChange={(e) => update('currency', e.target.value.toUpperCase())}
              className={inputClass}
            />
          </div>

          {/* ── Documentation ── */}
          {sectionTitle('Documentation')}
          <div>
            <label htmlFor="cert_url" className="block text-sm font-medium text-gray-700">
              Certificate URL
            </label>
            <input
              id="cert_url"
              type="url"
              value={form.certificate_url}
              onChange={(e) => update('certificate_url', e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              id="notes"
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={3}
              className={inputClass}
              placeholder="Optional notes..."
            />
          </div>

          {/* Error */}
          {createStrain.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {createStrain.error.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={createStrain.isPending}>
              {createStrain.isPending ? 'Registering...' : 'Register Strain'}
            </Button>
            <Link href="/strains">
              <Button variant="secondary">Cancel</Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
