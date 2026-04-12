'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useReportDeviation } from '@/hooks';
import { Button, buttonVariants } from '@gacp-erp/ui-components';

const DEV_CLASSIFICATIONS = ['MINOR', 'MAJOR', 'CRITICAL'] as const;
const DEV_CATEGORIES = [
  'PROCESS',
  'EQUIPMENT',
  'MATERIAL',
  'ENVIRONMENTAL',
  'DOCUMENTATION',
  'PERSONNEL',
  'UTILITY',
] as const;

export function ReportDeviationForm() {
  const router = useRouter();
  const report = useReportDeviation();
  const [form, setForm] = useState({
    classification: 'MINOR',
    category: 'PROCESS',
    title: '',
    description: '',
    location: '',
    occurred_at: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    report.mutate(
      {
        classification: form.classification,
        category: form.category,
        title: form.title,
        description: form.description,
        ...(form.location ? { location: form.location } : {}),
        ...(form.occurred_at ? { occurred_at: new Date(form.occurred_at).toISOString() } : {}),
      } as Parameters<typeof report.mutate>[0],
      {
        onSuccess: (data) =>
          router.push(`/quality/deviations/${String((data as Record<string, unknown>)['id'])}`),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/quality/deviations" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to deviations
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Report Deviation</h1>
      </div>

      <form onSubmit={handleSubmit} className="card max-w-2xl">
        <div className="card-body space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Classification</label>
              <select
                className="input w-full"
                value={form.classification}
                onChange={(e) => setForm((f) => ({ ...f, classification: e.target.value }))}
              >
                {DEV_CLASSIFICATIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <select
                className="input w-full"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {DEV_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Location (optional)</label>
              <input
                className="input w-full"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                maxLength={300}
              />
            </div>
            <div>
              <label className="label">Occurred At (optional)</label>
              <input
                type="datetime-local"
                className="input w-full"
                value={form.occurred_at}
                onChange={(e) => setForm((f) => ({ ...f, occurred_at: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button type="submit" variant="default" disabled={report.isPending}>
              {report.isPending ? 'Reporting...' : 'Report Deviation'}
            </Button>
            <Link href="/quality/deviations" className={buttonVariants({ variant: 'outline' })}>
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
