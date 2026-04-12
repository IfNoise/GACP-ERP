'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  usePurchaseOrder,
  useSubmitPurchaseOrder,
  useAcknowledgePurchaseOrder,
  useClosePurchaseOrder,
  useCancelPurchaseOrder,
} from '@/hooks';
import {
  StatusBadge,
  WorkflowTimeline,
  AuditTrailPanel,
  SignatureDialog,
  Button,
  buttonVariants,
} from '@gacp-erp/ui-components';
import type { StatusVariant, WorkflowStep, AuditEvent } from '@gacp-erp/ui-components';

const PO_STAGES = ['DRAFT', 'SUBMITTED', 'ACKNOWLEDGED', 'RECEIVING', 'CLOSED'] as const;

const STATUS_VARIANT: Record<string, StatusVariant> = {
  DRAFT: 'draft',
  SUBMITTED: 'pending',
  ACKNOWLEDGED: 'active',
  RECEIVING: 'active',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
};

type SignAction = 'submit' | 'acknowledge' | 'close' | 'cancel';

export function PurchaseOrderDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data, isLoading } = usePurchaseOrder(id);
  const submitMutation = useSubmitPurchaseOrder();
  const ackMutation = useAcknowledgePurchaseOrder();
  const closeMutation = useClosePurchaseOrder();
  const cancelMutation = useCancelPurchaseOrder();
  const [signAction, setSignAction] = useState<SignAction | null>(null);

  if (isLoading) return <div className="animate-pulse p-6">Loading purchase order...</div>;
  if (!data) return <div className="p-6 text-red-600">Purchase order not found</div>;

  const po = data as Record<string, unknown>;
  const status = String(po['status']);
  const lines = (po['lines'] ?? []) as Record<string, unknown>[];

  const steps: WorkflowStep[] = PO_STAGES.map((stage) => {
    const idx = PO_STAGES.indexOf(stage);
    const currentIdx =
      status === 'CANCELLED' ? -1 : PO_STAGES.indexOf(status as (typeof PO_STAGES)[number]);
    let stepStatus: 'completed' | 'active' | 'pending' = 'pending';
    if (idx < currentIdx) stepStatus = 'completed';
    else if (idx === currentIdx) stepStatus = 'active';
    return { id: stage, label: stage, status: stepStatus };
  });

  const buildSignature = (_password: string, reason: string) => ({
    signed_by: '00000000-0000-0000-0000-000000000000',
    signer_name: 'Current User',
    signer_role: 'OPERATOR',
    signature_type: 'approval' as const,
    authentication_method: 'password' as const,
    digital_signature: 'a'.repeat(256),
    content_hash: 'b'.repeat(64),
    ip_address: '127.0.0.1',
    workstation_id: 'WS-001',
    signature_meaning: reason || 'Purchase order action',
    signed_at: new Date().toISOString(),
  });

  const handleSign = async (password: string, reason: string) => {
    const sig = buildSignature(password, reason);
    if (signAction === 'submit')
      await submitMutation.mutateAsync({
        id,
        body: { electronic_signature: sig } as unknown as Parameters<
          typeof submitMutation.mutateAsync
        >[0]['body'],
      });
    else if (signAction === 'acknowledge')
      await ackMutation.mutateAsync({
        id,
        body: { notes: reason } as unknown as Parameters<typeof ackMutation.mutateAsync>[0]['body'],
      });
    else if (signAction === 'close')
      await closeMutation.mutateAsync({
        id,
        body: { electronic_signature: sig } as unknown as Parameters<
          typeof closeMutation.mutateAsync
        >[0]['body'],
      });
    else if (signAction === 'cancel')
      await cancelMutation.mutateAsync({
        id,
        body: { reason } as unknown as Parameters<typeof cancelMutation.mutateAsync>[0]['body'],
      });
    setSignAction(null);
    router.refresh();
  };

  const auditEvents: AuditEvent[] = [
    {
      id: 'created',
      action: 'Created',
      actor: String(po['created_by'] ?? ''),
      timestamp: String(po['created_at']),
    },
    ...(String(po['updated_at']) !== String(po['created_at'])
      ? [
          {
            id: 'updated',
            action: 'Updated',
            actor: String(po['updated_by'] ?? ''),
            timestamp: String(po['updated_at']),
          },
        ]
      : []),
  ];

  const actionButtons: {
    label: string;
    action: SignAction;
    show: boolean;
    variant: 'default' | 'outline';
  }[] = [
    { label: 'Submit PO', action: 'submit', show: status === 'DRAFT', variant: 'default' },
    {
      label: 'Acknowledge',
      action: 'acknowledge',
      show: status === 'SUBMITTED',
      variant: 'default',
    },
    { label: 'Close PO', action: 'close', show: status === 'RECEIVING', variant: 'default' },
    {
      label: 'Cancel PO',
      action: 'cancel',
      show: ['DRAFT', 'SUBMITTED'].includes(status),
      variant: 'outline',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/procurement/purchase-orders"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to purchase orders
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{String(po['po_number'])}</h1>
          <StatusBadge status={STATUS_VARIANT[status] ?? 'draft'} label={status} />
        </div>
      </div>

      {/* Workflow */}
      <WorkflowTimeline steps={steps} />

      {/* Actions */}
      <div className="flex gap-3">
        {actionButtons
          .filter((a) => a.show)
          .map((a) => (
            <Button key={a.action} variant={a.variant} onClick={() => setSignAction(a.action)}>
              {a.label}
            </Button>
          ))}
        {status === 'ACKNOWLEDGED' && (
          <Link href="/procurement/receiving" className={buttonVariants()}>
            Receive Goods
          </Link>
        )}
      </div>

      {/* Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Order Details</h2>
          </div>
          <div className="card-body">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Supplier</dt>
                <dd className="font-medium">{String(po['supplier_id']).slice(0, 8)}…</dd>
              </div>
              <div>
                <dt className="text-gray-500">Currency</dt>
                <dd className="font-medium">{String(po['currency'] ?? 'USD')}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Total Value</dt>
                <dd className="font-medium">
                  $
                  {Number(po['total_value'] ?? 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Expected Delivery</dt>
                <dd className="font-medium">
                  {po['expected_delivery_date']
                    ? new Date(String(po['expected_delivery_date'])).toLocaleDateString()
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">3-Way Match</dt>
                <dd className="font-medium">
                  <StatusBadge
                    status={po['three_way_match_passed'] ? 'approved' : 'pending'}
                    label={po['three_way_match_passed'] ? 'Passed' : 'Pending'}
                  />
                </dd>
              </div>
              {po['notes'] ? (
                <div className="col-span-2">
                  <dt className="text-gray-500">Notes</dt>
                  <dd className="mt-1 whitespace-pre-wrap">{String(po['notes'])}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>
      </div>

      {/* PO Lines */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Order Lines ({lines.length})</h2>
        </div>
        <div className="card-body overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2">#</th>
                <th className="pb-2">Description</th>
                <th className="pb-2 text-right">Qty</th>
                <th className="pb-2">UoM</th>
                <th className="pb-2 text-right">Unit Price</th>
                <th className="pb-2 text-right">Total</th>
                <th className="pb-2 text-right">Received</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => {
                const qty = Number(line['quantity'] ?? 0);
                const price = Number(line['unit_price'] ?? 0);
                const received = Number(line['received_quantity'] ?? 0);
                return (
                  <tr key={i} className="border-b">
                    <td className="py-2">{Number(line['line_number'] ?? i + 1)}</td>
                    <td className="py-2">{String(line['item_description'])}</td>
                    <td className="py-2 text-right">{qty}</td>
                    <td className="py-2">{String(line['unit_of_measure'] ?? '')}</td>
                    <td className="py-2 text-right">{price.toFixed(2)}</td>
                    <td className="py-2 text-right">{(qty * price).toFixed(2)}</td>
                    <td className="py-2 text-right">
                      {received > 0 ? (
                        <span className={received >= qty ? 'text-green-600' : 'text-yellow-600'}>
                          {received} / {qty}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AuditTrailPanel events={auditEvents} />

      {signAction != null && (
        <SignatureDialog
          open={signAction != null}
          onClose={() => setSignAction(null)}
          onConfirm={handleSign}
          title={`${signAction === 'submit' ? 'Submit' : signAction === 'acknowledge' ? 'Acknowledge' : signAction === 'close' ? 'Close' : 'Cancel'} Purchase Order`}
        />
      )}
    </div>
  );
}
