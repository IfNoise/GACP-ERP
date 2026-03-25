'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreateEmployee } from '@/hooks';
import { Button } from '@gacp-erp/ui-components';

export function CreateEmployeeForm() {
  const router = useRouter();
  const createEmployee = useCreateEmployee();

  const [form, setForm] = useState({
    employee_number: '',
    user_id: '',
    position: '',
    department: '',
    hire_date: new Date().toISOString().split('T')[0],
    is_active: true,
  });

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employee_number || !form.user_id || !form.position || !form.department) return;

    createEmployee.mutate(
      {
        employee_number: form.employee_number,
        user_id: form.user_id,
        position: form.position,
        department: form.department,
        hire_date: form.hire_date as string,
        competency_profile_id: null,
        is_active: form.is_active,
      },
      { onSuccess: () => router.push('/workforce/employees') },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/workforce/employees" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to employees
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">New Employee</h1>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="card-body space-y-5">
          {/* Employee Number */}
          <div>
            <label htmlFor="employee_number" className="block text-sm font-medium text-gray-700">
              Employee Number *
            </label>
            <input
              id="employee_number"
              type="text"
              value={form.employee_number}
              onChange={(e) => update('employee_number', e.target.value.toUpperCase())}
              placeholder="EMP-000001"
              pattern="^EMP-\d{6}$"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              required
            />
            <p className="mt-1 text-xs text-gray-400">Format: EMP-NNNNNN (e.g. EMP-000001)</p>
          </div>

          {/* User ID */}
          <div>
            <label htmlFor="user_id" className="block text-sm font-medium text-gray-700">
              Keycloak User ID *
            </label>
            <input
              id="user_id"
              type="text"
              value={form.user_id}
              onChange={(e) => update('user_id', e.target.value)}
              placeholder="UUID from Keycloak"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              required
            />
          </div>

          {/* Position */}
          <div>
            <label htmlFor="position" className="block text-sm font-medium text-gray-700">
              Position *
            </label>
            <input
              id="position"
              type="text"
              value={form.position}
              onChange={(e) => update('position', e.target.value)}
              placeholder="e.g. Cultivation Technician"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              required
            />
          </div>

          {/* Department */}
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700">
              Department *
            </label>
            <select
              id="department"
              value={form.department}
              onChange={(e) => update('department', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              required
            >
              <option value="">Select department…</option>
              <option value="Cultivation">Cultivation</option>
              <option value="Quality Control">Quality Control</option>
              <option value="Processing">Processing</option>
              <option value="Packaging">Packaging</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Security">Security</option>
              <option value="Administration">Administration</option>
              <option value="Finance">Finance</option>
              <option value="IT">IT</option>
            </select>
          </div>

          {/* Hire Date */}
          <div>
            <label htmlFor="hire_date" className="block text-sm font-medium text-gray-700">
              Hire Date *
            </label>
            <input
              id="hire_date"
              type="date"
              value={form.hire_date}
              onChange={(e) => update('hire_date', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              required
            />
          </div>

          {/* Active */}
          <div className="flex items-center gap-2">
            <input
              id="is_active"
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => update('is_active', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Active employee
            </label>
          </div>

          {/* Error */}
          {createEmployee.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {createEmployee.error.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={createEmployee.isPending}>
              {createEmployee.isPending ? 'Creating…' : 'Create Employee'}
            </Button>
            <Link href="/workforce/employees">
              <Button variant="secondary">Cancel</Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
