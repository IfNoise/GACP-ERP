'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreateSupplier } from '@/hooks';
import { Button, DatePicker } from '@gacp-erp/ui-components';

export function CreateSupplierForm() {
  const router = useRouter();
  const createSupplier = useCreateSupplier();

  const [form, setForm] = useState({
    name: '',
    qualification_status: '',
    qualification_expiry: '',
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    contact_person: '',
    notes: '',
  });

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;

    const contactDetails: Record<string, string> = {};
    if (form.contact_email) contactDetails.email = form.contact_email;
    if (form.contact_phone) contactDetails.phone = form.contact_phone;
    if (form.contact_address) contactDetails.address = form.contact_address;
    if (form.contact_person) contactDetails.contact_person = form.contact_person;

    createSupplier.mutate(
      {
        name: form.name,
        qualification_status:
          (form.qualification_status as 'QUALIFIED' | 'PROVISIONAL' | 'DISQUALIFIED') || undefined,
        qualification_expiry: form.qualification_expiry || undefined,
        contact_details: Object.keys(contactDetails).length > 0 ? contactDetails : undefined,
        notes: form.notes || undefined,
      },
      { onSuccess: () => router.push('/procurement/suppliers') },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/procurement/suppliers" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to suppliers
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">New Supplier</h1>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="card-body space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Supplier Name *
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Supplier name"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              required
            />
          </div>

          {/* Qualification Status */}
          <div>
            <label
              htmlFor="qualification_status"
              className="block text-sm font-medium text-gray-700"
            >
              Qualification Status
            </label>
            <select
              id="qualification_status"
              value={form.qualification_status}
              onChange={(e) => update('qualification_status', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="">Not specified</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="PROVISIONAL">Provisional</option>
              <option value="DISQUALIFIED">Disqualified</option>
            </select>
          </div>

          {/* Qualification Expiry */}
          <div>
            <label
              htmlFor="qualification_expiry"
              className="block text-sm font-medium text-gray-700"
            >
              Qualification Expiry
            </label>
            <DatePicker
              value={form.qualification_expiry ? new Date(form.qualification_expiry) : undefined}
              onChange={(date) =>
                update('qualification_expiry', date ? (date.toISOString().split('T')[0] ?? '') : '')
              }
              placeholder="Select expiry date"
              className="mt-1 w-full"
            />
          </div>

          {/* Contact Details */}
          <fieldset className="rounded-lg border border-gray-200 p-4">
            <legend className="px-2 text-sm font-medium text-gray-700">Contact Details</legend>
            <div className="space-y-4">
              <div>
                <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700">
                  Contact Person
                </label>
                <input
                  id="contact_person"
                  type="text"
                  value={form.contact_person}
                  onChange={(e) => update('contact_person', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="contact_email"
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => update('contact_email', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  id="contact_phone"
                  type="tel"
                  value={form.contact_phone}
                  onChange={(e) => update('contact_phone', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label
                  htmlFor="contact_address"
                  className="block text-sm font-medium text-gray-700"
                >
                  Address
                </label>
                <textarea
                  id="contact_address"
                  value={form.contact_address}
                  onChange={(e) => update('contact_address', e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>
          </fieldset>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              id="notes"
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Optional notes…"
            />
          </div>

          {/* Error */}
          {createSupplier.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {createSupplier.error.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={createSupplier.isPending}>
              {createSupplier.isPending ? 'Creating…' : 'Create Supplier'}
            </Button>
            <Link href="/procurement/suppliers">
              <Button variant="secondary">Cancel</Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
