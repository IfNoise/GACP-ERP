'use client';

import { useState } from 'react';
import {
  useBatches,
  useLatestBiologicalAssetValuation,
  useRecordBiologicalAssetValuation,
} from '@/hooks';
import { StatusBadge, KPICard, Button } from '@gacp-erp/ui-components';
import type { StatusVariant } from '@gacp-erp/ui-components';

const METHOD_VARIANT: Record<string, StatusVariant> = {
  FAIR_VALUE: 'approved',
  COST: 'pending',
};

export function BiologicalAssetDashboard() {
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const { data: batchesData, isLoading: loadingBatches } = useBatches({ limit: 50 });
  const { data: valuation, isLoading: loadingVal } =
    useLatestBiologicalAssetValuation(selectedBatchId);
  const recordMutation = useRecordBiologicalAssetValuation();

  const [method, setMethod] = useState<'FAIR_VALUE' | 'COST'>('FAIR_VALUE');
  const [fairValue, setFairValue] = useState('');
  const [costToSell, setCostToSell] = useState('');
  const [costValue, setCostValue] = useState('');
  const [quantityGrams, setQuantityGrams] = useState('');
  const [showForm, setShowForm] = useState(false);

  const batches = ((batchesData as Record<string, unknown>)?.['data'] ?? []) as Record<
    string,
    unknown
  >[];
  const val = valuation as Record<string, unknown> | null;

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId) return;

    const body = {
      batch_id: selectedBatchId,
      valuation_method: method,
      fair_value: Number(fairValue),
      cost_to_sell: Number(costToSell),
      cost_value: Number(costValue),
      quantity_grams: Number(quantityGrams),
    } as Parameters<typeof recordMutation.mutateAsync>[0];

    await recordMutation.mutateAsync(body);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Biological Assets</h1>
          <p className="mt-1 text-sm text-gray-500">
            IAS 41 biological asset valuations for cannabis batches
          </p>
        </div>
        <Button
          variant={showForm ? 'outline' : 'default'}
          onClick={() => setShowForm((v) => !v)}
          disabled={!selectedBatchId}
        >
          {showForm ? 'Cancel' : 'Record Valuation'}
        </Button>
      </div>

      {/* Batch selector */}
      <div className="card">
        <div className="card-body">
          <label className="label">Select Batch</label>
          {loadingBatches ? (
            <div className="animate-pulse">Loading batches...</div>
          ) : (
            <select
              className="input w-72"
              value={selectedBatchId}
              onChange={(e) => {
                setSelectedBatchId(e.target.value);
                setShowForm(false);
              }}
            >
              <option value="">— Select a batch —</option>
              {batches.map((b) => (
                <option key={String(b['id'])} value={String(b['id'])}>
                  {String(b['batch_code'] ?? b['id'])}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Current Valuation */}
      {selectedBatchId && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Latest Valuation</h2>
          </div>
          <div className="card-body">
            {loadingVal ? (
              <div className="animate-pulse">Loading valuation...</div>
            ) : val ? (
              <div className="grid gap-4 md:grid-cols-4">
                <KPICard
                  title="Fair Value"
                  value={`$${Number(val['fair_value'] ?? 0).toLocaleString()}`}
                />
                <KPICard
                  title="Cost Value"
                  value={`$${Number(val['cost_value'] ?? 0).toLocaleString()}`}
                />
                <KPICard
                  title="Net Realizable"
                  value={`$${Number(val['net_realizable_value'] ?? 0).toLocaleString()}`}
                />
                <KPICard
                  title="Quantity (g)"
                  value={Number(val['quantity_grams'] ?? 0).toLocaleString()}
                />
              </div>
            ) : (
              <p className="text-sm text-gray-500">No valuation recorded for this batch</p>
            )}
            {val && (
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                <span>Method:</span>
                <StatusBadge
                  status={METHOD_VARIANT[String(val['valuation_method'])] ?? 'draft'}
                  label={String(val['valuation_method'])}
                />
                <span>Valued: {new Date(String(val['valued_at'])).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Record Form */}
      {showForm && selectedBatchId && (
        <form onSubmit={handleRecord} className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Record New Valuation</h2>
          </div>
          <div className="card-body grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Valuation Method *</label>
              <select
                className="input"
                value={method}
                onChange={(e) => setMethod(e.target.value as 'FAIR_VALUE' | 'COST')}
              >
                <option value="FAIR_VALUE">Fair Value</option>
                <option value="COST">Cost</option>
              </select>
            </div>
            <div>
              <label className="label">Quantity (grams) *</label>
              <input
                type="number"
                className="input"
                value={quantityGrams}
                onChange={(e) => setQuantityGrams(e.target.value)}
                required
                min={0}
                step={0.01}
              />
            </div>
            <div>
              <label className="label">Fair Value ($) *</label>
              <input
                type="number"
                className="input"
                value={fairValue}
                onChange={(e) => setFairValue(e.target.value)}
                required
                min={0}
                step={0.01}
              />
            </div>
            <div>
              <label className="label">Cost to Sell ($) *</label>
              <input
                type="number"
                className="input"
                value={costToSell}
                onChange={(e) => setCostToSell(e.target.value)}
                required
                min={0}
                step={0.01}
              />
            </div>
            <div>
              <label className="label">Cost Value ($) *</label>
              <input
                type="number"
                className="input"
                value={costValue}
                onChange={(e) => setCostValue(e.target.value)}
                required
                min={0}
                step={0.01}
              />
            </div>
          </div>
          <div className="card-body border-t pt-4">
            <Button type="submit" disabled={recordMutation.isPending}>
              {recordMutation.isPending ? 'Recording...' : 'Record Valuation'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
