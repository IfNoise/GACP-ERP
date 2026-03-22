'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDocument, useApproveDocument } from '@/hooks';
import { StatusBadge, SignatureDialog } from '@gacp-erp/ui-components';
import type { StatusVariant } from '@gacp-erp/ui-components';

const STATUS_VARIANT: Record<string, StatusVariant> = {
  DRAFT: 'draft',
  UNDER_REVIEW: 'pending',
  APPROVED: 'approved',
  EFFECTIVE: 'active',
  SUPERSEDED: 'overdue',
  OBSOLETE: 'closed',
};

interface Props {
  id: string;
}

export function DocumentApprove({ id }: Props) {
  const router = useRouter();
  const { data: doc, isLoading } = useDocument(id);
  const approveMutation = useApproveDocument();
  const [signatureOpen, setSignatureOpen] = useState(false);

  const d = doc as Record<string, unknown> | undefined;

  const handleApprove = useCallback(
    async (password: string, reason: string) => {
      await approveMutation.mutateAsync({
        id,
        body: { password, reason },
      });
      setSignatureOpen(false);
      router.push(`/documents/${id}`);
    },
    [id, approveMutation, router],
  );

  if (isLoading) {
    return <div className="py-12 text-center text-gray-400">Loading document…</div>;
  }
  if (!d) {
    return <div className="py-12 text-center text-red-500">Document not found</div>;
  }

  const status = String(d['status'] ?? 'DRAFT');

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500">
        <Link href="/documents" className="hover:text-gray-700">
          Documents
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/documents/${id}`} className="hover:text-gray-700">
          {String(d['document_number'])}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">Approve</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900">Approve Document</h1>

      {/* Document Summary Card */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">{String(d['title'])}</h2>
          <StatusBadge
            status={STATUS_VARIANT[status] ?? 'draft'}
            label={status.replace(/_/g, ' ')}
          />
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-gray-500">Document Number</dt>
            <dd className="font-medium">{String(d['document_number'])}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Type</dt>
            <dd className="font-medium">{String(d['document_type']).replace(/_/g, ' ')}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Owner</dt>
            <dd className="font-medium">{String(d['owner_id']).slice(0, 8)}…</dd>
          </div>
          <div>
            <dt className="text-gray-500">Created</dt>
            <dd className="font-medium">
              {d['created_at'] ? new Date(String(d['created_at'])).toLocaleString() : '—'}
            </dd>
          </div>
        </dl>

        {typeof d['description'] === 'string' && (
          <p className="mt-4 text-sm text-gray-600 whitespace-pre-wrap">
            {String(d['description'])}
          </p>
        )}
      </div>

      {/* Approval notice */}
      <div className="rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">
          <strong>Electronic Signature Required.</strong> Approving this document will record your
          identity, timestamp, and approval reason per 21 CFR Part 11 requirements. This action is
          irreversible.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setSignatureOpen(true)}
          className="rounded-md bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700"
        >
          Sign & Approve
        </button>
        <Link
          href={`/documents/${id}`}
          className="rounded-md border px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>

      {/* Signature Dialog */}
      <SignatureDialog
        open={signatureOpen}
        onClose={() => setSignatureOpen(false)}
        onConfirm={handleApprove}
        title="Approve Document"
      />
    </div>
  );
}
