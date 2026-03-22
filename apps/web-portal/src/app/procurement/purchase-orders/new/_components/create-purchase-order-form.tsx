'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSuppliers, useCreatePurchaseOrder } from '@/hooks';

interface POLine {
  item_description: string;
  quantity: number;
  unit_price: number;
  unit_of_measure: string;
}

const EMPTY_LINE: POLine = {
  item_description: '',
  quantity: 0,
  unit_price: 0,
  unit_of_measure: 'kg',
};

export function CreatePurchaseOrderForm() {
  const router = useRouter();
  const createMutation = useCreatePurchaseOrder();
  const { data: suppliersData } = useSuppliers({ limit: 100 });

  const [supplierId, setSupplierId] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<POLine[]>([{ ...EMPTY_LINE }]);

  const suppliers = ((suppliersData as Record<string, unknown>)?.['data'] ?? []) as Record<
    string,
    unknown
  >[];

  const totalValue = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);

  const updateLine = (idx: number, patch: Partial<POLine>) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };
  const addLine = () => setLines((prev) => [...prev, { ...EMPTY_LINE }]);
  const removeLine = (idx: number) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      supplier_id: supplierId,
      currency,
      expected_delivery_date: expectedDelivery || undefined,
      notes: notes || undefined,
      lines: lines
        .filter((l) => l.item_description && l.quantity > 0)
        .map((l, i) => ({ line_number: i + 1, ...l })),
    } as Parameters<typeof createMutation.mutateAsync>[0];

    const result = await createMutation.mutateAsync(body);
    const newId = (result as Record<string, unknown>)['id'];
    router.push(`/procurement/purchase-orders/${String(newId)}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/procurement/purchase-orders"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to purchase orders
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">New Purchase Order</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Order Details</h2>
          </div>
          <div className="card-body grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Supplier *</label>
              <select
                className="input"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                required
              >
                <option value="">— Select supplier —</option>
                {suppliers.map((s) => (
                  <option key={String(s['id'])} value={String(s['id'])}>
                    {String(s['supplier_code'])} — {String(s['name'])}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Currency</label>
              <select
                className="input"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div>
              <label className="label">Expected Delivery Date</label>
              <input
                type="date"
                className="input"
                value={expectedDelivery}
                onChange={(e) => setExpectedDelivery(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Notes</label>
              <input
                className="input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold">Order Lines</h2>
            <button type="button" className="btn btn-secondary" onClick={addLine}>
              + Add Line
            </button>
          </div>
          <div className="card-body overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">Description</th>
                  <th className="pb-2 text-right">Qty</th>
                  <th className="pb-2">UoM</th>
                  <th className="pb-2 text-right">Unit Price</th>
                  <th className="pb-2 text-right">Total</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2">
                      <input
                        className="input w-48"
                        value={line.item_description}
                        onChange={(e) => updateLine(idx, { item_description: e.target.value })}
                        required
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        className="input w-24 text-right"
                        value={line.quantity || ''}
                        onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })}
                        min={1}
                        required
                      />
                    </td>
                    <td className="py-2">
                      <input
                        className="input w-20"
                        value={line.unit_of_measure}
                        onChange={(e) => updateLine(idx, { unit_of_measure: e.target.value })}
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        className="input w-28 text-right"
                        value={line.unit_price || ''}
                        onChange={(e) => updateLine(idx, { unit_price: Number(e.target.value) })}
                        min={0}
                        step={0.01}
                        required
                      />
                    </td>
                    <td className="py-2 text-right font-medium">
                      {(line.quantity * line.unit_price).toFixed(2)}
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => removeLine(idx)}
                        disabled={lines.length <= 1}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-semibold">
                  <td colSpan={4} className="py-2">
                    Total
                  </td>
                  <td className="py-2 text-right">
                    {currency} {totalValue.toFixed(2)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Purchase Order'}
          </button>
          <Link href="/procurement/purchase-orders" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
