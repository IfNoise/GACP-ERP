'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreateChangeControl } from '@/hooks';
import { Button, buttonVariants } from '@gacp-erp/ui-components';

const CHANGE_TYPES = ['MINOR', 'MAJOR', 'EMERGENCY'] as const;

export function CreateChangeControlForm() {
  const router = useRouter();
  const create = useCreateChangeControl();
  const [form, setForm] = useState({ title: '', description: '', change_type: 'MINOR' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(
      {
        title: form.title,
        description: form.description,
        change_type: form.change_type,
      } as Parameters<typeof create.mutate>[0],
      {
        onSuccess: (data) =>
          router.push(
            `/quality/change-controls/${String((data as Record<string, unknown>)['id'])}`,
          ),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/quality/change-controls" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to change controls
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">New Change Control</h1>
      </div>

      <form onSubmit={handleSubmit} className="card max-w-2xl">
        <div className="card-body space-y-4">
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
            <label className="label">Change Type</label>
            <select
              className="input w-full"
              value={form.change_type}
              onChange={(e) => setForm((f) => ({ ...f, change_type: e.target.value }))}
            >
              {CHANGE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
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
          <div className="flex gap-3">
            <Button type="submit" variant="default" disabled={create.isPending}>
              {create.isPending ? 'Creating...' : 'Create Change Control'}
            </Button>
            <Link
              href="/quality/change-controls"
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
