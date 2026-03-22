'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { useDocument, useDocumentVersions, useSubmitForReview } from '@/hooks';
import { StatusBadge } from '@gacp-erp/ui-components';
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

export function DocumentDetail({ id }: Props) {
  const { data: doc, isLoading } = useDocument(id);
  const { data: versions } = useDocumentVersions(id);
  const submitForReview = useSubmitForReview();

  const d = doc as Record<string, unknown> | undefined;
  const versionList = (versions ?? []) as Record<string, unknown>[];

  const handleSubmitForReview = useCallback(() => {
    // In real app, would open a dialog to pick reviewer
    const reviewerId = prompt('Enter reviewer user ID (UUID):');
    if (reviewerId) {
      submitForReview.mutate({ id, body: { reviewer_id: reviewerId } });
    }
  }, [id, submitForReview]);

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
        <span className="text-gray-900">{String(d['document_number'])}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{String(d['title'])}</h1>
            <StatusBadge
              status={STATUS_VARIANT[status] ?? 'draft'}
              label={status.replace(/_/g, ' ')}
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {String(d['document_number'])} · {String(d['document_type']).replace(/_/g, ' ')}
          </p>
        </div>
        <div className="flex gap-2">
          {status === 'DRAFT' && (
            <button
              onClick={handleSubmitForReview}
              disabled={submitForReview.isPending}
              className="rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 disabled:opacity-50"
            >
              Submit for Review
            </button>
          )}
          {(status === 'UNDER_REVIEW' || status === 'DRAFT') && (
            <Link
              href={`/documents/${id}/approve`}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Approve
            </Link>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Info Card */}
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700 uppercase">
            Document Information
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Owner</dt>
              <dd className="font-medium">{String(d['owner_id']).slice(0, 8)}…</dd>
            </div>
            {typeof d['reviewer_id'] === 'string' && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Reviewer</dt>
                <dd className="font-medium">{String(d['reviewer_id']).slice(0, 8)}…</dd>
              </div>
            )}
            {typeof d['approver_id'] === 'string' && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Approver</dt>
                <dd className="font-medium">{String(d['approver_id']).slice(0, 8)}…</dd>
              </div>
            )}
            {typeof d['next_review_date'] === 'string' && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Next Review</dt>
                <dd className="font-medium">{String(d['next_review_date'])}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500">Created</dt>
              <dd className="font-medium">
                {d['created_at'] ? new Date(String(d['created_at'])).toLocaleString() : '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Updated</dt>
              <dd className="font-medium">
                {d['updated_at'] ? new Date(String(d['updated_at'])).toLocaleString() : '—'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Description Card */}
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700 uppercase">Description</h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {d['description'] ? String(d['description']) : 'No description provided.'}
          </p>
          {Array.isArray(d['tags']) && (d['tags'] as string[]).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1">
              {(d['tags'] as string[]).map((tag: string) => (
                <span key={tag} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Version History */}
      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 uppercase">Version History</h2>
          <span className="text-xs text-gray-400">{versionList.length} version(s)</span>
        </div>

        {versionList.length === 0 ? (
          <p className="text-sm text-gray-400">No versions uploaded yet.</p>
        ) : (
          <div className="divide-y">
            {versionList.map((v) => (
              <div key={String(v['id'])} className="flex items-center justify-between py-3">
                <div>
                  <span className="font-mono text-sm font-medium">
                    {String(v['version_number'])}
                  </span>
                  <p className="text-xs text-gray-500">{String(v['change_summary'])}</p>
                </div>
                <div className="text-right text-xs text-gray-400">
                  <div>
                    {v['created_at'] ? new Date(String(v['created_at'])).toLocaleString() : ''}
                  </div>
                  {typeof v['approved_by'] === 'string' && (
                    <div className="text-green-600">
                      Approved by {String(v['approved_by']).slice(0, 8)}…
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
