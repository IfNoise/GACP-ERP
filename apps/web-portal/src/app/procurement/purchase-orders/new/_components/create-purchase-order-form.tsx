'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSuppliers, useCreatePurchaseOrder } from '@/hooks';
import { POLineDialog, POLineData, EMPTY_LINE, ITEM_TYPE_BADGE } from './po-line-dialog';

export function CreatePurchaseOrderForm() {
  const router = useRouter();
  const createMutation = useCreatePurchaseOrder();
  const { data: suppliersData } = useSuppliers({ limit: 100 });

  const [supplierId, setSupplierId] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<POLineData[]>([{ ...EMPTY_LINE }]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const suppliers = ((suppliersData as Record<string, unknown> | undefined)?.['data'] ??
    []) as Record<string, unknown>[];

  const totalValue = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);

  const openAddDialog = () => {
    setEditingIdx(null);
    setDialogOpen(true);
  };

  const openEditDialog = (idx: number) => {
    setEditingIdx(idx);
    setDialogOpen(true);
  };

  const handleDialogSave = (line: POLineData) => {
    if (editingIdx === null) {
      setLines((prev) => [...prev, line]);
    } else {
      setLines((prev) => prev.map((l, i) => (i === editingIdx ? line : l)));
    }
    setDialogOpen(false);
  };

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
        .map((l, i) => ({
          line_number: i + 1,
          item_description: l.item_description,
          quantity: l.quantity,
          unit_price: l.unit_price,
          unit_of_measure: l.unit_of_measure,
          ...(l.strain_id ? { strain_id: l.strain_id } : {}),
        })),
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
        {/* Order header */}
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

        {/* Order lines */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold">Order Lines</h2>
            <button type="button" className="btn btn-secondary" onClick={openAddDialog}>
              + Add Line
            </button>
          </div>
          <div className="card-body overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">#</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Description</th>
                  <th className="pb-2 text-right">Qty</th>
                  <th className="pb-2">UoM</th>
                  <th className="pb-2 text-right">Unit Price</th>
                  <th className="pb-2 text-right">Total</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => {
                  const badge = ITEM_TYPE_BADGE[line.item_type];
                  return (
                    <tr key={idx} className="border-b">
                      <td className="py-2 text-gray-400">{idx + 1}</td>
                      <td className="py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-2">
                        <span className="font-medium">{line.item_description}</span>
                        {line.strain_id && (
                          <span className="ml-2 text-xs text-green-600">● genetics linked</span>
                        )}
                      </td>
                      <td className="py-2 text-right">{line.quantity}</td>
                      <td className="py-2 text-gray-500">{line.unit_of_measure}</td>
                      <td className="py-2 text-right">{line.unit_price.toFixed(2)}</td>
                      <td className="py-2 text-right font-medium">
                        {(line.quantity * line.unit_price).toFixed(2)}
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="text-blue-500 hover:text-blue-700"
                            onClick={() => openEditDialog(idx)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="text-red-400 hover:text-red-600 disabled:opacity-30"
                            onClick={() => removeLine(idx)}
                            disabled={lines.length <= 1}
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-semibold">
                  <td colSpan={6} className="py-2">
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

      {dialogOpen && (
        <POLineDialog
          initial={editingIdx !== null ? (lines[editingIdx] ?? null) : null}
          onSave={handleDialogSave}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </div>
  );
}
