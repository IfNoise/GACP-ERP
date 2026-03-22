'use client';

import Link from 'next/link';

const REPORT_TEMPLATES = [
  {
    id: 'daily-plant-report',
    name: 'Daily Plant Activity Report',
    description: 'Daily plant operations and activities. Auto-generated from audit events.',
    category: 'Operations',
  },
  {
    id: 'weekly-summary',
    name: 'Weekly Summary',
    description: 'Week-over-week metrics across cultivation, processing, and quality.',
    category: 'Operations',
  },
  {
    id: 'batch-lifecycle',
    name: 'Batch Lifecycle Report',
    description: 'Complete traceability report for a single batch from seed to distribution.',
    category: 'Traceability',
  },
  {
    id: 'equipment-calibration',
    name: 'Equipment Calibration Report',
    description: 'Calibration records, deviations, and next-due dates for all equipment.',
    category: 'Quality',
  },
  {
    id: 'audit-trail-export',
    name: 'Audit Trail Export',
    description: 'Export audit trail records filtered by entity, date range, and user.',
    category: 'Compliance',
    href: '/reports/audit-trail',
  },
  {
    id: 'training-compliance',
    name: 'Training Compliance Report',
    description: 'Employee training status, expired certifications, and compliance rates.',
    category: 'HR / Training',
  },
  {
    id: 'financial-summary',
    name: 'Financial Summary',
    description: 'Revenue, costs, and margin breakdown for a selected period.',
    category: 'Finance',
  },
  {
    id: 'quality-events',
    name: 'Quality Events Summary',
    description: 'CAPAs, deviations, and change controls opened/closed during the period.',
    category: 'Quality',
  },
] as const;

const CATEGORIES = [...new Set(REPORT_TEMPLATES.map((t) => t.category))];

export function ReportCatalog() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Catalog</h1>
          <p className="text-sm text-gray-500">
            GACP-compliant reports with digital signatures and Mayan EDMS integration
          </p>
        </div>
        <Link
          href="/analytics"
          className="rounded-md border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ← Analytics
        </Link>
      </div>

      {/* Categories */}
      {CATEGORIES.map((category) => (
        <section key={category}>
          <h2 className="mb-3 text-sm font-semibold text-gray-700 uppercase">{category}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {REPORT_TEMPLATES.filter((t) => t.category === category).map((template) => (
              <Link
                key={template.id}
                href={
                  'href' in template && template.href
                    ? template.href
                    : `/reports/generate?template=${template.id}`
                }
                className="group rounded-lg border bg-white p-5 shadow-sm transition-colors hover:border-blue-300"
              >
                <h3 className="font-medium text-gray-900 group-hover:text-blue-600">
                  {template.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">{template.description}</p>
                <span className="mt-3 inline-block text-xs font-medium text-blue-600">
                  Generate →
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
