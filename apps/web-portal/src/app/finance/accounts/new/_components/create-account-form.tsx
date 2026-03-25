'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreateAccount, useAccounts } from '@/hooks';
import { Button } from '@gacp-erp/ui-components';

export function CreateAccountForm() {
  const router = useRouter();
  const createAccount = useCreateAccount();
  const { data: accountsData } = useAccounts({ limit: 200 });

  const accounts =
    (accountsData as unknown as { data?: { id: string; account_code: string; name: string }[] })
      ?.data ?? [];

  const [form, setForm] = useState({
    account_code: '',
    account_type: 'ASSET',
    parent_id: '',
    name: '',
    description: '',
  });

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.account_code || !form.name) return;

    createAccount.mutate(
      {
        account_code: form.account_code,
        account_type: form.account_type as 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE',
        parent_id: form.parent_id || undefined,
        name: form.name,
        description: form.description || undefined,
      },
      { onSuccess: () => router.push('/finance/accounts') },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/finance/accounts" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to chart of accounts
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">New Account</h1>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="card-body space-y-5">
          {/* Account Code */}
          <div>
            <label htmlFor="account_code" className="block text-sm font-medium text-gray-700">
              Account Code *
            </label>
            <input
              id="account_code"
              type="text"
              value={form.account_code}
              onChange={(e) => update('account_code', e.target.value)}
              placeholder="e.g. 1010"
              pattern="\\d{4}"
              title="4-digit account code"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              required
            />
          </div>

          {/* Account Type */}
          <div>
            <label htmlFor="account_type" className="block text-sm font-medium text-gray-700">
              Account Type *
            </label>
            <select
              id="account_type"
              value={form.account_type}
              onChange={(e) => update('account_type', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="ASSET">Asset</option>
              <option value="LIABILITY">Liability</option>
              <option value="EQUITY">Equity</option>
              <option value="REVENUE">Revenue</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </div>

          {/* Parent Account */}
          <div>
            <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700">
              Parent Account
            </label>
            <select
              id="parent_id"
              value={form.parent_id}
              onChange={(e) => update('parent_id', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="">No parent (top-level)</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.account_code} — {acc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Account Name *
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. Cash and Equivalents"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Optional description…"
            />
          </div>

          {/* Error */}
          {createAccount.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {createAccount.error.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={createAccount.isPending}>
              {createAccount.isPending ? 'Creating…' : 'Create Account'}
            </Button>
            <Link href="/finance/accounts">
              <Button variant="secondary">Cancel</Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
