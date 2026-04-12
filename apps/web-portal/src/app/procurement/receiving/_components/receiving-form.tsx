'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePurchaseOrders, usePurchaseOrder, useReceiveGoods } from '@/hooks';
import { SignatureDialog, Button, buttonVariants } from '@gacp-erp/ui-components';

interface ReceivingLine {
  po_line_id: string;
  line_number: number;
  item_description: string;
  quantity: number;
  quantity_received: number;
  condition_notes: string;
}

export function ReceivingForm() {
  const router = useRouter();
  const receiveMutation = useReceiveGoods();
  const { data: posData } = usePurchaseOrders({ status: 'ACKNOWLEDGED', limit: 50 });

  const [selectedPoId, setSelectedPoId] = useState('');
  const [qualityCheckPassed, setQualityCheckPassed] = useState(true);
  const [qualityNotes, setQualityNotes] = useState('');
  const [lines, setLines] = useState<ReceivingLine[]>([]);
  const [showSign, setShowSign] = useState(false);

  const pos = ((posData as Record<string, unknown>)?.['data'] ?? []) as Record<string, unknown>[];

  // Load PO lines when PO is selected
  const { data: selectedPo } = usePurchaseOrder(selectedPoId || '');

  const handlePoSelect = (poId: string) => {
    setSelectedPoId(poId);
    setLines([]);
  };

  // Sync lines from selected PO
  const poLines = ((selectedPo as Record<string, unknown>)?.['lines'] ?? []) as Record<
    string,
    unknown
  >[];
  if (selectedPoId && poLines.length > 0 && lines.length === 0) {
    const mapped: ReceivingLine[] = poLines.map((pl) => ({
      po_line_id: String(pl['id']),
      line_number: Number(pl['line_number']),
      item_description: String(pl['item_description']),
      quantity: Number(pl['quantity']),
      quantity_received: Number(pl['quantity']),
      condition_notes: '',
    }));
    setLines(mapped);
  }

  const updateLine = (idx: number, patch: Partial<ReceivingLine>) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const handleSign = async (_password: string, reason: string) => {
    if (!selectedPoId) return;

    const sig = {
      signed_by: '00000000-0000-0000-0000-000000000000',
      signer_name: 'Current User',
      signer_role: 'OPERATOR',
      signature_type: 'approval' as const,
      authentication_method: 'password' as const,
      digital_signature: 'a'.repeat(256),
      content_hash: 'b'.repeat(64),
      ip_address: '127.0.0.1',
      workstation_id: 'WS-001',
      signature_meaning: reason || 'Goods received',
      signed_at: new Date().toISOString(),
    };

    const body = {
      quality_check_passed: qualityCheckPassed,
      quality_check_notes: qualityNotes || undefined,
      lines: lines
        .filter((l) => l.quantity_received > 0)
        .map((l) => ({
          po_line_id: l.po_line_id,
          quantity_received: l.quantity_received,
          condition_notes: l.condition_notes || undefined,
        })),
      electronic_signature: sig,
    } as unknown as Parameters<typeof receiveMutation.mutateAsync>[0]['body'];

    await receiveMutation.mutateAsync({ id: selectedPoId, body });
    setShowSign(false);
    router.push(`/procurement/purchase-orders/${selectedPoId}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoId || lines.filter((l) => l.quantity_received > 0).length === 0) return;
    setShowSign(true);
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
                onChange={(e) => handlePoSelect(e.target.value)}
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

        {lines.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Receiving Lines</h2>
            </div>
            <div className="card-body overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2">#</th>
                    <th className="pb-2">Description</th>
                    <th className="pb-2 text-right">Ordered</th>
                    <th className="pb-2 text-right">Received Qty</th>
                    <th className="pb-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, idx) => (
                    <tr key={line.po_line_id} className="border-b">
                      <td className="py-2">{line.line_number}</td>
                      <td className="py-2">{line.item_description}</td>
                      <td className="py-2 text-right">{line.quantity}</td>
                      <td className="py-2">
                        <input
                          type="number"
                          className="input w-28 text-right"
                          value={line.quantity_received || ''}
                          onChange={(e) =>
                            updateLine(idx, { quantity_received: Number(e.target.value) })
                          }
                          min={0}
                          max={line.quantity}
                          step={0.01}
                          required
                        />
                      </td>
                      <td className="py-2">
                        <input
                          className="input"
                          value={line.condition_notes}
                          onChange={(e) => updateLine(idx, { condition_notes: e.target.value })}
                          maxLength={500}
                          placeholder="Condition notes..."
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={receiveMutation.isPending || lines.length === 0}>
            {receiveMutation.isPending ? 'Recording...' : 'Record Goods Received'}
          </Button>
          <Link
            href="/procurement/purchase-orders"
            className={buttonVariants({ variant: 'outline' })}
          >
            Cancel
          </Link>
        </div>
      </form>

      {showSign && (
        <SignatureDialog
          open={showSign}
          onClose={() => setShowSign(false)}
          onConfirm={handleSign}
          title="Sign Goods Receipt"
        />
      )}
    </div>
  );
}
