'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useChangeControl, useSubmitChangeControl } from '@/hooks';
import { Button, buttonVariants } from '@gacp-erp/ui-components';

export function SubmitChangeControlForm({ id }: { id: string }) {
  const router = useRouter();
  const { data } = useChangeControl(id);
  const submit = useSubmitChangeControl();
  const [notes, setNotes] = useState('');

  const cc = data as Record<string, unknown> | undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit.mutate(
      {
        id,
        body: { ...(notes ? { submission_notes: notes } : {}) } as Parameters<
          typeof submit.mutate
        >[0]['body'],
      },
      { onSuccess: () => router.push(`/quality/change-controls/${id}`) },
    );
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
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Submit for Review</h1>
      </div>

      <form onSubmit={handleSubmit} className="card max-w-2xl">
        <div className="card-body space-y-4">
          <div>
            <label className="label">Submission Notes (optional)</label>
            <textarea
              className="input w-full"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes for the review team..."
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" variant="default" disabled={submit.isPending}>
              {submit.isPending ? 'Submitting...' : 'Submit for Review'}
            </Button>
            <Link
              href={`/quality/change-controls/${id}`}
              className={buttonVariants({ variant: 'outline' })}
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
