'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupplier, useQualifySupplier } from '@/hooks';
import { StatusBadge, AuditTrailPanel, SignatureDialog, Button } from '@gacp-erp/ui-components';
import type { StatusVariant, AuditEvent } from '@gacp-erp/ui-components';
import { useState } from 'react';

const QUAL_VARIANT: Record<string, StatusVariant> = {
  QUALIFIED: 'approved',
  PROVISIONAL: 'pending',
  DISQUALIFIED: 'rejected',
};

export function SupplierDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data, isLoading } = useSupplier(id);
  const qualifyMutation = useQualifySupplier();
  const [showSign, setShowSign] = useState(false);

  if (isLoading) return <div className="animate-pulse p-6">Loading supplier...</div>;
  if (!data) return <div className="p-6 text-red-600">Supplier not found</div>;

  const sup = data as Record<string, unknown>;
  const qualStatus = String(sup['qualification_status']);
  const contacts = (sup['contact_details'] ?? {}) as Record<string, unknown>;

  const handleQualify = async (password: string, reason: string) => {
    const body = {
      qualification_status: 'QUALIFIED',
      electronic_signature: { password, reason },
    } as Parameters<typeof qualifyMutation.mutateAsync>[0]['body'];
    await qualifyMutation.mutateAsync({ id, body });
    setShowSign(false);
    router.refresh();
  };

  const auditEvents: AuditEvent[] = [
    {
      id: 'created',
      action: 'Created',
      actor: String(sup['created_by'] ?? ''),
      timestamp: String(sup['created_at']),
    },
    ...(String(sup['updated_at']) !== String(sup['created_at'])
      ? [
          {
            id: 'updated',
            action: 'Updated',
            actor: String(sup['updated_by'] ?? ''),
            timestamp: String(sup['updated_at']),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/procurement/suppliers" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to suppliers
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{String(sup['supplier_code'])}</h1>
          <StatusBadge status={QUAL_VARIANT[qualStatus] ?? 'draft'} label={qualStatus} />
        </div>
        <p className="mt-1 text-lg text-gray-700">{String(sup['name'])}</p>
      </div>

      {/* Actions */}
      {qualStatus !== 'QUALIFIED' && (
        <div className="flex gap-3">
          <Button onClick={() => setShowSign(true)}>Qualify Supplier</Button>
        </div>
      )}

      {/* Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Supplier Details</h2>
          </div>
          <div className="card-body">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd className="font-medium">
                  <StatusBadge
                    status={sup['is_active'] ? 'active' : 'closed'}
                    label={sup['is_active'] ? 'Active' : 'Inactive'}
                  />
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Qualification Expiry</dt>
                <dd className="font-medium">
                  {sup['qualification_expiry']
                    ? new Date(String(sup['qualification_expiry'])).toLocaleDateString()
                    : '—'}
                </dd>
              </div>
              {sup['notes'] ? (
                <div className="col-span-2">
                  <dt className="text-gray-500">Notes</dt>
                  <dd className="mt-1 whitespace-pre-wrap">{String(sup['notes'])}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Contact Details</h2>
          </div>
          <div className="card-body">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Contact Person</dt>
                <dd className="font-medium">{String(contacts['contact_person'] ?? '—')}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd className="font-medium">{String(contacts['email'] ?? '—')}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Phone</dt>
                <dd className="font-medium">{String(contacts['phone'] ?? '—')}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-gray-500">Address</dt>
                <dd className="font-medium">{String(contacts['address'] ?? '—')}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <AuditTrailPanel events={auditEvents} />

      {showSign && (
        <SignatureDialog
          open={showSign}
          onClose={() => setShowSign(false)}
          onConfirm={handleQualify}
          title="Qualify Supplier"
        />
      )}
    </div>
  );
}
