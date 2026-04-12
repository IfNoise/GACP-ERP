'use client';

import { useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DatePicker, Button } from '@gacp-erp/ui-components';

const TEMPLATES = [
  { value: 'daily-plant-report', label: 'Daily Plant Activity Report' },
  { value: 'weekly-summary', label: 'Weekly Summary' },
  { value: 'batch-lifecycle', label: 'Batch Lifecycle Report' },
  { value: 'equipment-calibration', label: 'Equipment Calibration Report' },
  { value: 'training-compliance', label: 'Training Compliance Report' },
  { value: 'financial-summary', label: 'Financial Summary' },
  { value: 'quality-events', label: 'Quality Events Summary' },
] as const;

const FORMATS = ['PDF', 'JSON'] as const;

export function ReportGenerateForm() {
  const searchParams = useSearchParams();
  const preselected = searchParams.get('template') ?? '';

  const [template, setTemplate] = useState(preselected);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [format, setFormat] = useState<string>('PDF');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ url: string; hash: string } | null>(null);
  const [error, setError] = useState('');

  const handleGenerate = useCallback(async () => {
    if (!template || !dateFrom || !dateTo) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setGenerating(true);
    setResult(null);

    try {
      const apiBase = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api';
      const res = await fetch(`${apiBase}/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template, dateFrom, dateTo, format }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as Record<string, string>)['message'] ?? 'Report generation failed');
      }

      const data = (await res.json()) as { url: string; hash: string };
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setGenerating(false);
    }
  }, [template, dateFrom, dateTo, format]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500">
        <Link href="/reports" className="hover:text-gray-700">
          Reports
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">Generate</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900">Generate Report</h1>
      <p className="text-sm text-gray-500">
        Reports are generated as GACP-compliant PDFs with QR verification codes and digital
        signatures.
      </p>

      <div className="space-y-5 rounded-lg border bg-white p-6 shadow-sm">
        {/* Template */}
        <div>
          <label htmlFor="template" className="mb-1 block text-sm font-medium text-gray-700">
            Report Template *
          </label>
          <select
            id="template"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm"
          >
            <option value="">Select a template…</option>
            {TEMPLATES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="dateFrom" className="mb-1 block text-sm font-medium text-gray-700">
              From *
            </label>
            <DatePicker
              value={dateFrom ? new Date(dateFrom) : undefined}
              onChange={(date) => setDateFrom(date ? (date.toISOString().split('T')[0] ?? '') : '')}
              placeholder="Select from date"
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="dateTo" className="mb-1 block text-sm font-medium text-gray-700">
              To *
            </label>
            <DatePicker
              value={dateTo ? new Date(dateTo) : undefined}
              onChange={(date) => setDateTo(date ? (date.toISOString().split('T')[0] ?? '') : '')}
              placeholder="Select to date"
              className="w-full"
            />
          </div>
        </div>

        {/* Format */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Output Format</label>
          <div className="flex gap-4">
            {FORMATS.map((f) => (
              <label key={f} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="format"
                  value={f}
                  checked={format === f}
                  onChange={() => setFormat(f)}
                  className="text-blue-600"
                />
                {f}
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? 'Generating…' : 'Generate Report'}
          </Button>
          <Link
            href="/reports"
            className="rounded-md border px-6 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {/* Result */}
      {result && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-5">
          <h3 className="font-semibold text-green-800">Report Generated Successfully</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-green-700">Download:</dt>
              <dd>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  {result.url}
                </a>
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-green-700">SHA-256:</dt>
              <dd className="font-mono text-xs break-all">{result.hash}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
