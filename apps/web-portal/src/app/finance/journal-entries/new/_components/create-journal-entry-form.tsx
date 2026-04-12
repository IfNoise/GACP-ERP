'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccounts, useCreateJournalEntry } from '@/hooks';
import { Button, buttonVariants } from '@gacp-erp/ui-components';

interface JournalLine {
  account_id: string;
  account_code: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  batch_id?: string;
}

const EMPTY_LINE: JournalLine = {
  account_id: '',
  account_code: '',
  description: '',
  debit_amount: 0,
  credit_amount: 0,
};

export function CreateJournalEntryForm() {
  const router = useRouter();
  const createMutation = useCreateJournalEntry();
  const { data: accountsData } = useAccounts({ limit: 200, is_active: 'true' });

  const [description, setDescription] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState<JournalLine[]>([{ ...EMPTY_LINE }, { ...EMPTY_LINE }]);

  const accounts = ((accountsData as Record<string, unknown>)?.['data'] ?? []) as Record<
    string,
    unknown
  >[];

  const totalDebit = lines.reduce((s, l) => s + l.debit_amount, 0);
  const totalCredit = lines.reduce((s, l) => s + l.credit_amount, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const updateLine = (idx: number, patch: Partial<JournalLine>) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const addLine = () => setLines((prev) => [...prev, { ...EMPTY_LINE }]);
  const removeLine = (idx: number) => {
    if (lines.length <= 2) return;
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAccountSelect = (idx: number, accountId: string) => {
    const acc = accounts.find((a) => String(a['id']) === accountId);
    updateLine(idx, {
      account_id: accountId,
      account_code: acc ? String(acc['account_code']) : '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) return;

    const body = {
      description,
      entry_date: entryDate,
      lines: lines
        .filter((l) => l.account_id && (l.debit_amount > 0 || l.credit_amount > 0))
        .map((l) => ({
          account_id: l.account_id,
          account_code: l.account_code,
          description: l.description,
          debit_amount: l.debit_amount,
          credit_amount: l.credit_amount,
          ...(l.batch_id ? ({ batch_id: l.batch_id } as { batch_id: string }) : {}),
        })),
    } as Parameters<typeof createMutation.mutateAsync>[0];

    const result = await createMutation.mutateAsync(body);
    const newId = (result as Record<string, unknown>)['id'];
    router.push(`/finance/journal-entries/${String(newId)}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/finance/journal-entries" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to journal entries
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">New Journal Entry</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Entry Details</h2>
          </div>
          <div className="card-body grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Description *</label>
              <input
                className="input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                maxLength={500}
              />
            </div>
            <div>
              <label className="label">Entry Date *</label>
              <input
                type="date"
                className="input"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold">Journal Lines</h2>
            <Button type="button" variant="secondary" onClick={addLine}>
              + Add Line
            </Button>
          </div>
          <div className="card-body overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">Account</th>
                  <th className="pb-2">Description</th>
                  <th className="pb-2 text-right">Debit</th>
                  <th className="pb-2 text-right">Credit</th>
                  <th className="pb-2">Batch ID</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2">
                      <select
                        className="input w-48"
                        value={line.account_id}
                        onChange={(e) => handleAccountSelect(idx, e.target.value)}
                        required
                      >
                        <option value="">Select account</option>
                        {accounts.map((a) => (
                          <option key={String(a['id'])} value={String(a['id'])}>
                            {String(a['account_code'])} — {String(a['name'])}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2">
                      <input
                        className="input w-40"
                        value={line.description}
                        onChange={(e) => updateLine(idx, { description: e.target.value })}
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        className="input w-28 text-right"
                        min={0}
                        step={0.01}
                        value={line.debit_amount || ''}
                        onChange={(e) =>
                          updateLine(idx, {
                            debit_amount: Number(e.target.value),
                            credit_amount: 0,
                          })
                        }
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        className="input w-28 text-right"
                        min={0}
                        step={0.01}
                        value={line.credit_amount || ''}
                        onChange={(e) =>
                          updateLine(idx, {
                            credit_amount: Number(e.target.value),
                            debit_amount: 0,
                          })
                        }
                      />
                    </td>
                    <td className="py-2">
                      <input
                        className="input w-32"
                        value={line.batch_id ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) updateLine(idx, { batch_id: val });
                          else {
                            setLines((prev) =>
                              prev.map((l, i) => {
                                if (i !== idx) return l;
                                const { batch_id: _, ...rest } = l;
                                return rest as JournalLine;
                              }),
                            );
                          }
                        }}
                        placeholder="Optional"
                      />
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => removeLine(idx)}
                        disabled={lines.length <= 2}
                      >
                        ✕
                      </button>
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
                  <td colSpan={2} className="py-2">
                    {totalDebit > 0 && isBalanced ? (
                      <span className="text-green-600">✓ Balanced</span>
                    ) : totalDebit > 0 ? (
                      <span className="text-red-600">
                        ✗ Unbalanced ({(totalDebit - totalCredit).toFixed(2)})
                      </span>
                    ) : null}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={!isBalanced || createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Journal Entry'}
          </Button>
          <Link href="/finance/journal-entries" className={buttonVariants({ variant: 'outline' })}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
