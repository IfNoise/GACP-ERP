'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreateDocument } from '@/hooks';

const DOC_TYPES = [
  { value: 'SOP', label: 'Standard Operating Procedure' },
  { value: 'FORM', label: 'Form' },
  { value: 'REPORT', label: 'Report' },
  { value: 'PROTOCOL', label: 'Protocol' },
  { value: 'POLICY', label: 'Policy' },
  { value: 'WORK_INSTRUCTION', label: 'Work Instruction' },
  { value: 'SPECIFICATION', label: 'Specification' },
] as const;

export function DocumentUploadForm() {
  const router = useRouter();
  const createDocument = useCreateDocument();

  const [form, setForm] = useState({
    document_number: '',
    title: '',
    document_type: 'SOP' as string,
    description: '',
    tags: '',
    next_review_date: '',
  });

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    },
    [],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const tags = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await createDocument.mutateAsync({
        document_number: form.document_number,
        title: form.title,
        document_type: form.document_type as 'SOP',
        ...(form.description ? { description: form.description } : {}),
        ...(tags.length > 0 ? { tags } : {}),
        ...(form.next_review_date ? { next_review_date: form.next_review_date } : {}),
      });

      router.push('/documents');
    },
    [form, createDocument, router],
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500">
        <Link href="/documents" className="hover:text-gray-700">
          Documents
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">New Document</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900">Upload New Document</h1>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border bg-white p-6 shadow-sm">
        {/* Document Number */}
        <div>
          <label htmlFor="document_number" className="mb-1 block text-sm font-medium text-gray-700">
            Document Number *
          </label>
          <input
            id="document_number"
            name="document_number"
            value={form.document_number}
            onChange={handleChange}
            required
            maxLength={30}
            placeholder="e.g. SOP-CULT-001"
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">
            Title *
          </label>
          <input
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            maxLength={255}
            placeholder="Document title"
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        {/* Document Type */}
        <div>
          <label htmlFor="document_type" className="mb-1 block text-sm font-medium text-gray-700">
            Document Type *
          </label>
          <select
            id="document_type"
            name="document_type"
            value={form.document_type}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2 text-sm"
          >
            {DOC_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            placeholder="Brief document description"
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="mb-1 block text-sm font-medium text-gray-700">
            Tags
          </label>
          <input
            id="tags"
            name="tags"
            value={form.tags}
            onChange={handleChange}
            placeholder="Comma-separated tags (e.g. gacp, cultivation, safety)"
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        {/* Next Review Date */}
        <div>
          <label
            htmlFor="next_review_date"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Next Review Date
          </label>
          <input
            id="next_review_date"
            name="next_review_date"
            type="date"
            value={form.next_review_date}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={createDocument.isPending}
            className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {createDocument.isPending ? 'Creating…' : 'Create Document'}
          </button>
          <Link
            href="/documents"
            className="rounded-md border px-6 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>

        {createDocument.isError && (
          <p className="text-sm text-red-600">{createDocument.error.message}</p>
        )}
      </form>
    </div>
  );
}
