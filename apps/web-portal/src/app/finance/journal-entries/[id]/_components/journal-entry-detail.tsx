'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useJournalEntry, usePostJournalEntry, useReverseJournalEntry } from '@/hooks';
import { StatusBadge, AuditTrailPanel, SignatureDialog } from '@gacp-erp/ui-components';
import type { StatusVariant, AuditEvent } from '@gacp-erp/ui-components';
import { useState } from 'react';

const STATUS_VARIANT: Record<string, StatusVariant> = {
  DRAFT: 'draft',
  POSTED: 'approved',
  REVERSED: 'rejected',
};

export function JournalEntryDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data, isLoading } = useJournalEntry(id);
  const postMutation = usePostJournalEntry();
  const reverseMutation = useReverseJournalEntry();
  const [signAction, setSignAction] = useState<'post' | 'reverse' | null>(null);

  if (isLoading) return <div className="animate-pulse p-6">Loading journal entry...</div>;
  if (!data) return <div className="p-6 text-red-600">Journal entry not found</div>;

  const je = data as Record<string, unknown>;
  const status = String(je['status']);
  const lines = (je['lines'] ?? []) as Record<string, unknown>[];

  const totalDebit = lines.reduce((s, l) => s + Number(l['debit_amount'] ?? 0), 0);
  const totalCredit = lines.reduce((s, l) => s + Number(l['credit_amount'] ?? 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const handleSign = async (password: string, reason: string) => {
    const sig = { password, reason } as unknown as Parameters<
      typeof postMutation.mutateAsync
    >[0]['body'];
    if (signAction === 'post') {
      await postMutation.mutateAsync({ id, body: sig });
    } else if (signAction === 'reverse') {
      await reverseMutation.mutateAsync({
        id,
        body: { ...sig, reason } as unknown as Parameters<
          typeof reverseMutation.mutateAsync
        >[0]['body'],
      });
    }
    setSignAction(null);
    router.refresh();
  };

  const auditEvents: AuditEvent[] = [
    {
      id: 'created',
      action: 'Created',
      actor: String(je['created_by'] ?? ''),
      timestamp: String(je['created_at']),
    },
    ...(String(je['updated_at']) !== String(je['created_at'])
      ? [
          {
            id: 'updated',
            action: 'Updated',
            actor: String(je['updated_by'] ?? ''),
            timestamp: String(je['updated_at']),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/finance/journal-entries" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to journal entries
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{String(je['entry_number'])}</h1>
          <StatusBadge status={STATUS_VARIANT[status] ?? 'draft'} label={status} />
        </div>
        <p className="mt-1 text-lg text-gray-700">{String(je['description'])}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {status === 'DRAFT' && (
          <button
            className="btn btn-primary"
            onClick={() => setSignAction('post')}
            disabled={!isBalanced}
          >
            Post Entry
          </button>
        )}
        {status === 'POSTED' && (
          <button className="btn btn-secondary" onClick={() => setSignAction('reverse')}>
            Reverse Entry
          </button>
        )}
      </div>

      {/* Entry Details */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Entry Details</h2>
        </div>
        <div className="card-body">
          <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <dt className="text-gray-500">Entry Date</dt>
              <dd className="font-medium">
                {new Date(String(je['entry_date'])).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Status</dt>
              <dd className="font-medium">{status}</dd>
            </div>
            {je['reversal_of_id'] ? (
              <div>
                <dt className="text-gray-500">Reversal Of</dt>
                <dd className="font-medium">
                  <Link
                    href={`/finance/journal-entries/${String(je['reversal_of_id'])}`}
                    className="text-green-700 hover:underline"
                  >
                    {String(je['reversal_of_id']).slice(0, 8)}…
                  </Link>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>

      {/* Journal Lines */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Journal Lines</h2>
        </div>
        <div className="card-body overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2">Account</th>
                <th className="pb-2">Description</th>
                <th className="pb-2 text-right">Debit</th>
                <th className="pb-2 text-right">Credit</th>
                <th className="pb-2">Batch</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="border-b">
                  <td className="py-2 font-mono">{String(line['account_code'])}</td>
                  <td className="py-2">{String(line['description'] ?? '')}</td>
                  <td className="py-2 text-right">{Number(line['debit_amount']).toFixed(2)}</td>
                  <td className="py-2 text-right">{Number(line['credit_amount']).toFixed(2)}</td>
                  <td className="py-2 text-sm text-gray-500">
                    {line['batch_id'] ? String(line['batch_id']).slice(0, 8) + '…' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 font-semibold">
                <td colSpan={2} className="py-2">
                  Totals
                </td>
                <td className="py-2 text-right">{totalDebit.toFixed(2)}</td>
                <td className="py-2 text-right">{totalCredit.toFixed(2)}</td>
                <td className="py-2">
                  {isBalanced ? (
                    <span className="text-green-600">✓ Balanced</span>
                  ) : (
                    <span className="text-red-600">✗ Unbalanced</span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Audit Trail */}
      <AuditTrailPanel events={auditEvents} />

      {/* Signature Dialog */}
      {signAction != null && (
        <SignatureDialog
          open={signAction != null}
          onClose={() => setSignAction(null)}
          onConfirm={handleSign}
          title={signAction === 'post' ? 'Post Journal Entry' : 'Reverse Journal Entry'}
        />
      )}
    </div>
  );
}
