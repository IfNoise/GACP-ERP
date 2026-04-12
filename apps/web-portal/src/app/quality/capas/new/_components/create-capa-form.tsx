'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreateCAPA } from '@/hooks';
import { Button, DatePicker, buttonVariants } from '@gacp-erp/ui-components';

const CAPA_TYPES = ['CORRECTIVE', 'PREVENTIVE'] as const;
const CAPA_SOURCES = ['DEVIATION', 'AUDIT', 'COMPLAINT', 'TREND', 'INSPECTION'] as const;

export function CreateCAPAForm() {
  const router = useRouter();
  const create = useCreateCAPA();
  const [form, setForm] = useState({
    type: 'CORRECTIVE',
    source: 'DEVIATION',
    title: '',
    description: '',
    due_date: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(
      {
        type: form.type,
        source: form.source,
        title: form.title,
        description: form.description,
        ...(form.due_date ? { due_date: form.due_date } : {}),
      } as Parameters<typeof create.mutate>[0],
      {
        onSuccess: (data) =>
          router.push(`/quality/capas/${String((data as Record<string, unknown>)['id'])}`),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/quality/capas" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to CAPAs
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">New CAPA</h1>
      </div>

      <form onSubmit={handleSubmit} className="card max-w-2xl">
        <div className="card-body space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Type</label>
              <select
                className="input w-full"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              >
                {CAPA_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Source</label>
              <select
                className="input w-full"
                value={form.source}
                onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
              >
                {CAPA_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Title</label>
            <input
              className="input w-full"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
              minLength={3}
              maxLength={500}
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input w-full"
              rows={5}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              required
              minLength={10}
            />
          </div>
          <div>
            <label className="label">Due Date (optional)</label>
            <DatePicker
              value={form.due_date ? new Date(form.due_date) : undefined}
              onChange={(date) =>
                setForm((f) => ({
                  ...f,
                  due_date: date ? (date.toISOString().split('T')[0] ?? '') : '',
                }))
              }
              placeholder="Select due date"
              className="w-full"
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" variant="default" disabled={create.isPending}>
              {create.isPending ? 'Creating...' : 'Create CAPA'}
            </Button>
            <Link href="/quality/capas" className={buttonVariants({ variant: 'outline' })}>
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
