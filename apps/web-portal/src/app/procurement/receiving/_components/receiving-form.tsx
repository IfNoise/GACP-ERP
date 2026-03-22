'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePurchaseOrders, useReceiveGoods } from '@/hooks';

interface ReceivingLine {
  po_line_number: number;
  received_quantity: number;
  notes: string;
}

export function ReceivingForm() {
  const router = useRouter();
  const receiveMutation = useReceiveGoods();
  const { data: posData } = usePurchaseOrders({ status: 'ACKNOWLEDGED', limit: 50 });

  const [selectedPoId, setSelectedPoId] = useState('');
  const [qualityCheckPassed, setQualityCheckPassed] = useState(true);
  const [qualityNotes, setQualityNotes] = useState('');
  const [lines, setLines] = useState<ReceivingLine[]>([
    { po_line_number: 1, received_quantity: 0, notes: '' },
  ]);

  const pos = ((posData as Record<string, unknown>)?.['data'] ?? []) as Record<string, unknown>[];

  const updateLine = (idx: number, patch: Partial<ReceivingLine>) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };
  const addLine = () =>
    setLines((prev) => [
      ...prev,
      { po_line_number: prev.length + 1, received_quantity: 0, notes: '' },
    ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoId) return;

    const body = {
      quality_check_passed: qualityCheckPassed,
      quality_check_notes: qualityNotes || undefined,
      lines: lines.filter((l) => l.received_quantity > 0),
    } as unknown as Parameters<typeof receiveMutation.mutateAsync>[0]['body'];

    await receiveMutation.mutateAsync({ id: selectedPoId, body });
    router.push(`/procurement/purchase-orders/${selectedPoId}`);
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
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Receive Goods (GRN)</h1>
        <p className="mt-1 text-sm text-gray-500">Record goods received against a purchase order</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Receiving Details</h2>
          </div>
          <div className="card-body grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Purchase Order *</label>
              <select
                className="input"
                value={selectedPoId}
                onChange={(e) => setSelectedPoId(e.target.value)}
                required
              >
                <option value="">— Select PO —</option>
                {pos.map((p) => (
                  <option key={String(p['id'])} value={String(p['id'])}>
                    {String(p['po_number'])}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Quality Check Passed</label>
              <select
                className="input"
                value={qualityCheckPassed ? 'true' : 'false'}
                onChange={(e) => setQualityCheckPassed(e.target.value === 'true')}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Quality Notes</label>
              <textarea
                className="input"
                rows={2}
                value={qualityNotes}
                onChange={(e) => setQualityNotes(e.target.value)}
                maxLength={500}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold">Receiving Lines</h2>
            <button type="button" className="btn btn-secondary" onClick={addLine}>
              + Add Line
            </button>
          </div>
          <div className="card-body overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">PO Line #</th>
                  <th className="pb-2 text-right">Received Qty</th>
                  <th className="pb-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2">
                      <input
                        type="number"
                        className="input w-24"
                        value={line.po_line_number}
                        onChange={(e) =>
                          updateLine(idx, { po_line_number: Number(e.target.value) })
                        }
                        min={1}
                        required
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        className="input w-28 text-right"
                        value={line.received_quantity || ''}
                        onChange={(e) =>
                          updateLine(idx, { received_quantity: Number(e.target.value) })
                        }
                        min={0}
                        step={0.01}
                        required
                      />
                    </td>
                    <td className="py-2">
                      <input
                        className="input"
                        value={line.notes}
                        onChange={(e) => updateLine(idx, { notes: e.target.value })}
                        maxLength={500}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn btn-primary" disabled={receiveMutation.isPending}>
            {receiveMutation.isPending ? 'Recording...' : 'Record Goods Received'}
          </button>
          <Link href="/procurement/purchase-orders" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
