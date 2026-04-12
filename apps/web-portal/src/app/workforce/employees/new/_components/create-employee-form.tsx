'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCreateEmployee } from '@/hooks';
import { Button, DatePicker } from '@gacp-erp/ui-components';
import { SystemRoleEnum, CRITICAL_ROLES } from '@gacp-erp/shared-schemas';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  QUALITY_MANAGER: 'Quality Manager',
  CULTIVATION_MANAGER: 'Cultivation Manager',
  OPERATOR: 'Operator',
  AUDITOR: 'Auditor',
  READONLY: 'Read Only',
};

const INITIAL_FORM = {
  first_name: '',
  last_name: '',
  email: '',
  system_role: '',
  position: '',
  department: '',
  hire_date: new Date().toISOString().split('T')[0] ?? '',
  employee_number: '',
  is_active: true,
};

interface Credentials {
  username: string;
  temporary_password: string;
  system_role: string;
  employee_number: string;
  first_name: string;
  last_name: string;
}

export function CreateEmployeeForm() {
  const createEmployee = useCreateEmployee();

  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [copied, setCopied] = useState<'username' | 'password' | null>(null);

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleCopy = async (text: string, field: 'username' | 'password') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // clipboard API unavailable
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.first_name ||
      !form.last_name ||
      !form.email ||
      !form.system_role ||
      !form.position ||
      !form.department
    )
      return;

    createEmployee.mutate(
      {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        system_role: form.system_role as (typeof SystemRoleEnum)['options'][number],
        position: form.position,
        department: form.department,
        hire_date: form.hire_date,
        ...(form.employee_number ? { employee_number: form.employee_number } : {}),
        is_active: form.is_active,
      },
      {
        onSuccess: (data) => {
          const d = data as Record<string, unknown>;
          setCredentials({
            username: String(d['username'] ?? ''),
            temporary_password: String(d['temporary_password'] ?? ''),
            system_role: String(d['system_role'] ?? ''),
            employee_number: String(d['employee_number'] ?? ''),
            first_name: String(d['first_name'] ?? ''),
            last_name: String(d['last_name'] ?? ''),
          });
        },
      },
    );
  };

  // ── Credentials Card (post-creation) ──────────────────────────────────────
  if (credentials) {
    const isCritical = (CRITICAL_ROLES as readonly string[]).includes(credentials.system_role);

    return (
      <div className="space-y-6">
        <div>
          <Link href="/workforce/employees" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to employees
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Employee Created</h1>
        </div>

        <div className="card">
          <div className="card-body space-y-5">
            {/* Success banner */}
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="font-semibold text-green-800">
                {credentials.first_name} {credentials.last_name}
              </p>
              <p className="text-sm text-green-700">
                {credentials.employee_number} —{' '}
                {ROLE_LABELS[credentials.system_role] ?? credentials.system_role}
              </p>
            </div>

            {/* Warning */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="font-semibold text-amber-800">Save these credentials now</p>
              <p className="mt-1 text-sm text-amber-700">
                The temporary password is shown only once and cannot be retrieved later.
              </p>
            </div>

            {/* Credentials */}
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Username</dt>
                <dd className="mt-1 flex items-center gap-2">
                  <code className="rounded bg-gray-100 px-2 py-1 text-sm font-mono">
                    {credentials.username}
                  </code>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(credentials.username, 'username')}
                  >
                    {copied === 'username' ? 'Copied!' : 'Copy'}
                  </Button>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Temporary Password</dt>
                <dd className="mt-1 flex items-center gap-2">
                  <code className="rounded bg-gray-100 px-2 py-1 text-sm font-mono">
                    {credentials.temporary_password}
                  </code>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(credentials.temporary_password, 'password')}
                  >
                    {copied === 'password' ? 'Copied!' : 'Copy'}
                  </Button>
                </dd>
              </div>
            </dl>

            {/* MFA note */}
            {isCritical && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                This role requires Multi-Factor Authentication (TOTP). The employee will be prompted
                to configure MFA on first login.
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Link href="/workforce/employees">
                <Button>Go to Employee List</Button>
              </Link>
              <Button
                variant="secondary"
                onClick={() => {
                  setCredentials(null);
                  setForm({ ...INITIAL_FORM });
                  createEmployee.reset();
                }}
              >
                Create Another
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
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
          {/* First Name */}
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
              First Name *
            </label>
            <input
              id="first_name"
              type="text"
              value={form.first_name}
              onChange={(e) => update('first_name', e.target.value)}
              maxLength={100}
              placeholder="e.g. John"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              required
            />
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
              Last Name *
            </label>
            <input
              id="last_name"
              type="text"
              value={form.last_name}
              onChange={(e) => update('last_name', e.target.value)}
              maxLength={100}
              placeholder="e.g. Doe"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email *
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="e.g. john.doe@company.com"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              required
            />
          </div>

          {/* System Role */}
          <div>
            <label htmlFor="system_role" className="block text-sm font-medium text-gray-700">
              System Role *
            </label>
            <select
              id="system_role"
              value={form.system_role}
              onChange={(e) => update('system_role', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              required
            >
              <option value="">Select role…</option>
              {SystemRoleEnum.options.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role] ?? role}
                </option>
              ))}
            </select>
            {(CRITICAL_ROLES as readonly string[]).includes(form.system_role) && (
              <p className="mt-1 text-xs text-blue-600">
                This role requires TOTP MFA — the employee will configure it on first login.
              </p>
            )}
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
            <DatePicker
              value={form.hire_date ? new Date(form.hire_date) : undefined}
              onChange={(date) =>
                update('hire_date', date ? (date.toISOString().split('T')[0] ?? '') : '')
              }
              placeholder="Select hire date"
              className="mt-1 w-full"
            />
          </div>

          {/* Employee Number (optional) */}
          <div>
            <label htmlFor="employee_number" className="block text-sm font-medium text-gray-700">
              Employee Number
            </label>
            <input
              id="employee_number"
              type="text"
              value={form.employee_number}
              onChange={(e) => update('employee_number', e.target.value.toUpperCase())}
              placeholder="Auto-generated if blank"
              pattern="^EMP-\d{6}$"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <p className="mt-1 text-xs text-gray-400">Format: EMP-NNNNNN (e.g. EMP-000001)</p>
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
