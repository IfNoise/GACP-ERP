import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const qualityModules = [
  {
    title: 'Change Controls',
    description: 'Manage change requests, impact assessments, and approvals',
    href: '/quality/change-controls',
    count: null,
  },
  {
    title: 'CAPAs',
    description: 'Corrective and Preventive Actions — RCA, action plans, effectiveness checks',
    href: '/quality/capas',
    count: null,
  },
  {
    title: 'Deviations',
    description: 'Report and investigate process deviations',
    href: '/quality/deviations',
    count: null,
  },
  {
    title: 'Validation Protocols',
    description: 'IQ / OQ / PQ validation protocols and test execution',
    href: '/quality/validation-protocols',
    count: null,
  },
  {
    title: 'Quality Events',
    description: 'Complaints, audit findings, inspections, and quality issues',
    href: '/quality/quality-events',
    count: null,
  },
];

export default async function QualityPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-bold text-gray-900">Quality Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          GxP-compliant quality workflows — Change Control, CAPA, Deviations, Validation, Quality
          Events
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {qualityModules.map((mod) => (
            <Link
              key={mod.href}
              href={mod.href}
              className="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <h2 className="text-lg font-semibold text-gray-900">{mod.title}</h2>
              <p className="mt-1 text-sm text-gray-600">{mod.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
