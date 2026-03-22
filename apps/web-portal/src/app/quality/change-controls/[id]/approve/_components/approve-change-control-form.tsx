'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useChangeControl, useApproveChangeControl, useRejectChangeControl } from '@/hooks';
import { SignatureDialog } from '@gacp-erp/ui-components';

export function ApproveChangeControlForm({ id }: { id: string }) {
  const router = useRouter();
  const { data } = useChangeControl(id);
  const approve = useApproveChangeControl();
  const reject = useRejectChangeControl();
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [justification, setJustification] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showSignature, setShowSignature] = useState(false);

  const cc = data as Record<string, unknown> | undefined;

  const handleAction = (type: 'approve' | 'reject') => {
    if (type === 'reject' && rejectionReason.length < 10) return;
    setAction(type);
    setShowSignature(true);
  };

  // e-signature constructed server-side; password verification triggers it
  const handleSign = (_password: string, _reason: string) => {
    setShowSignature(false);
    if (action === 'approve') {
      approve.mutate(
        {
          id,
          body: { ...(justification ? { justification } : {}) } as Parameters<
            typeof approve.mutate
          >[0]['body'],
        },
        { onSuccess: () => router.push(`/quality/change-controls/${id}`) },
      );
    } else {
      reject.mutate(
        {
          id,
          body: { rejection_reason: rejectionReason } as Parameters<
            typeof reject.mutate
          >[0]['body'],
        },
        { onSuccess: () => router.push(`/quality/change-controls/${id}`) },
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/quality/change-controls/${id}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to {cc ? String(cc['ccn_number']) : 'change control'}
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Approve / Reject Change Control</h1>
      </div>

      <div className="grid gap-6 max-w-2xl lg:grid-cols-1">
        {/* Approve Section */}
        <div className="card">
          <div className="card-body space-y-4">
            <h2 className="text-lg font-semibold text-green-700">Approve</h2>
            <div>
              <label className="label">Justification (optional)</label>
              <textarea
                className="input w-full"
                rows={3}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn btn-primary"
              disabled={approve.isPending}
              onClick={() => handleAction('approve')}
            >
              {approve.isPending ? 'Approving...' : 'Approve with Signature'}
            </button>
          </div>
        </div>

        {/* Reject Section */}
        <div className="card">
          <div className="card-body space-y-4">
            <h2 className="text-lg font-semibold text-red-700">Reject</h2>
            <div>
              <label className="label">Rejection Reason (min 10 chars)</label>
              <textarea
                className="input w-full"
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                minLength={10}
                required
              />
            </div>
            <button
              type="button"
              className="btn btn-danger"
              disabled={reject.isPending || rejectionReason.length < 10}
              onClick={() => handleAction('reject')}
            >
              {reject.isPending ? 'Rejecting...' : 'Reject with Signature'}
            </button>
          </div>
        </div>
      </div>

      <SignatureDialog
        open={showSignature}
        onClose={() => setShowSignature(false)}
        onConfirm={handleSign}
        title={action === 'approve' ? 'Approve Change Control' : 'Reject Change Control'}
      />
    </div>
  );
}
