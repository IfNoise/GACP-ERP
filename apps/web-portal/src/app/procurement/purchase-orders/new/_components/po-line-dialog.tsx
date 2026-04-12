'use client';

import { useState, useEffect } from 'react';
import { useStrains } from '@/hooks';

export type ItemType = 'standard' | 'genetic_material' | 'equipment' | 'consumable' | 'service';

export interface POLineData {
  item_description: string;
  quantity: number;
  unit_price: number;
  unit_of_measure: string;
  item_type: ItemType;
  strain_id: string | null;
}

export const ITEM_TYPE_BADGE: Record<ItemType, { label: string; cls: string }> = {
  standard: { label: 'Standard', cls: 'bg-gray-100 text-gray-700' },
  genetic_material: { label: 'Genetics', cls: 'bg-green-100 text-green-700' },
  equipment: { label: 'Equipment', cls: 'bg-blue-100 text-blue-700' },
  consumable: { label: 'Consumable', cls: 'bg-amber-100 text-amber-700' },
  service: { label: 'Service', cls: 'bg-purple-100 text-purple-700' },
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  seed: 'Seed',
  clone: 'Clone',
  tissue_culture: 'Tissue Culture',
};

const UOM_PRESET = ['pc', 'pack', 'kg', 'g', 'L', 'mL', 'box', 'vial', 'h'];

export const EMPTY_LINE: POLineData = {
  item_description: '',
  quantity: 1,
  unit_price: 0,
  unit_of_measure: 'pc',
  item_type: 'standard',
  strain_id: null,
};

interface POLineDialogProps {
  initial: POLineData | null;
  onSave: (line: POLineData) => void;
  onClose: () => void;
}

function strainStatusSuffix(isActive: unknown, inspectionStatus: unknown): string {
  switch (String(inspectionStatus)) {
    case 'PENDING':
      return ' · inspection pending';
    case 'IN_PROGRESS':
      return ' · being inspected';
    case 'QUARANTINE':
      return ' · in quarantine';
    case 'REJECTED':
      return ' · rejected';
    default:
      break;
  }
  return isActive === true ? '' : ' · not yet procured';
}

export function POLineDialog({ initial, onSave, onClose }: POLineDialogProps) {
  const [form, setForm] = useState<POLineData>(initial ?? { ...EMPTY_LINE });
  const [customUom, setCustomUom] = useState(
    () => !!initial && !UOM_PRESET.includes(initial.unit_of_measure),
  );

  const isGenetic = form.item_type === 'genetic_material';

  const { data: strainsData } = useStrains(isGenetic ? { limit: 100 } : {});

  const strains = ((strainsData as Record<string, unknown> | undefined)?.['data'] ?? []) as Record<
    string,
    unknown
  >[];

  useEffect(() => {
    if (!isGenetic) setForm((f) => ({ ...f, strain_id: null }));
  }, [isGenetic]);

  const set = <K extends keyof POLineData>(key: K, value: POLineData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleUomSelect = (v: string) => {
    if (v === '__other__') {
      setCustomUom(true);
      set('unit_of_measure', '');
    } else {
      setCustomUom(false);
      set('unit_of_measure', v);
    }
  };

  const selectedUomOption = customUom
    ? '__other__'
    : UOM_PRESET.includes(form.unit_of_measure)
      ? form.unit_of_measure
      : '__other__';

  const valid =
    form.item_description.trim().length > 0 &&
    form.quantity > 0 &&
    form.unit_of_measure.trim().length > 0 &&
    (!isGenetic || form.strain_id !== null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">{initial ? 'Edit Line' : 'Add Line'}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="space-y-4 px-6 py-4">
          {/* Item Type */}
          <div>
            <label className="label">Item Type</label>
            <div className="flex flex-wrap gap-2">
              {(
                Object.entries(ITEM_TYPE_BADGE) as [ItemType, { label: string; cls: string }][]
              ).map(([val, { label, cls }]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => set('item_type', val)}
                  className={[
                    'rounded-full px-3 py-1 text-sm font-medium ring-2 transition-all',
                    cls,
                    form.item_type === val ? 'ring-current' : 'ring-transparent opacity-60',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Strain Selector (only for genetics) */}
          {isGenetic && (
            <div>
              <label className="label">Strain *</label>
              <select
                className="input"
                value={form.strain_id ?? ''}
                onChange={(e) => set('strain_id', e.target.value || null)}
                required
              >
                <option value="">— Select strain —</option>
                {strains.map((s) => (
                  <option key={String(s['id'])} value={String(s['id'])}>
                    {String(s['cultivar_code'])} — {String(s['name'])} (
                    {SOURCE_TYPE_LABELS[String(s['source_type'])] ?? String(s['source_type'])})
                    {strainStatusSuffix(s['is_active'], s['current_inspection_status'])}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="label">Description *</label>
            <input
              className="input"
              value={form.item_description}
              onChange={(e) => set('item_description', e.target.value)}
              placeholder={
                isGenetic
                  ? 'e.g. OG Kush feminised seeds'
                  : form.item_type === 'service'
                    ? 'e.g. Lab testing — cannabinoid profile'
                    : ''
              }
              maxLength={200}
              required
            />
          </div>

          {/* Quantity + UoM */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Quantity *</label>
              <input
                type="number"
                className="input"
                value={form.quantity || ''}
                onChange={(e) => set('quantity', Number(e.target.value))}
                min={0.001}
                step="any"
                required
              />
            </div>
            <div>
              <label className="label">Unit of Measure</label>
              {customUom ? (
                <input
                  className="input"
                  autoFocus
                  placeholder="e.g. vial"
                  value={form.unit_of_measure}
                  onChange={(e) => set('unit_of_measure', e.target.value)}
                  onBlur={() => {
                    if (!form.unit_of_measure.trim()) {
                      setCustomUom(false);
                      set('unit_of_measure', 'pc');
                    }
                  }}
                />
              ) : (
                <select
                  className="input"
                  value={selectedUomOption}
                  onChange={(e) => handleUomSelect(e.target.value)}
                >
                  {UOM_PRESET.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                  <option value="__other__">Other…</option>
                </select>
              )}
            </div>
          </div>

          {/* Unit Price */}
          <div>
            <label className="label">Unit Price</label>
            <input
              type="number"
              className="input"
              value={form.unit_price || ''}
              onChange={(e) => set('unit_price', Number(e.target.value))}
              min={0}
              step={0.01}
            />
          </div>

          {/* Running total preview */}
          {form.quantity > 0 && form.unit_price > 0 && (
            <p className="text-right text-sm text-gray-500">
              Line total:{' '}
              <span className="font-semibold text-gray-900">
                {(form.quantity * form.unit_price).toFixed(2)}
              </span>
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!valid}
            onClick={() => onSave(form)}
          >
            {initial ? 'Save Changes' : 'Add Line'}
          </button>
        </div>
      </div>
    </div>
  );
}
