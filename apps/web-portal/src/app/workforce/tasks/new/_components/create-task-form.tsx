'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreateTask, useEmployees, useZones } from '@/hooks';
import { Button } from '@gacp-erp/ui-components';

export function CreateTaskForm() {
  const router = useRouter();
  const createTask = useCreateTask();
  const { data: employeesData } = useEmployees({ limit: 100 });
  const { data: zonesData } = useZones({ limit: 100 });

  const employees =
    (
      employeesData as unknown as {
        data?: { id: string; employee_number: string; position: string }[];
      }
    )?.data ?? [];
  const zones =
    (zonesData as unknown as { data?: { id: string; zone_name: string }[] })?.data ?? [];

  const [form, setForm] = useState({
    title: '',
    description: '',
    assigned_to: '',
    zone_id: '',
    batch_id: '',
    priority: 'MEDIUM',
    scheduled_start: '',
    scheduled_end: '',
    sop_reference: '',
  });

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.assigned_to) return;

    createTask.mutate(
      {
        title: form.title,
        description: form.description || null,
        assigned_to: form.assigned_to,
        zone_id: form.zone_id || null,
        batch_id: form.batch_id || null,
        priority: form.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
        scheduled_start: form.scheduled_start ? new Date(form.scheduled_start).toISOString() : null,
        scheduled_end: form.scheduled_end ? new Date(form.scheduled_end).toISOString() : null,
        sop_reference: form.sop_reference || null,
      },
      { onSuccess: () => router.push('/workforce/tasks') },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/workforce/tasks" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to tasks
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">New Task</h1>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="card-body space-y-5">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="Task title"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Optional task description…"
            />
          </div>

          {/* Assigned To */}
          <div>
            <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700">
              Assign To *
            </label>
            <select
              id="assigned_to"
              value={form.assigned_to}
              onChange={(e) => update('assigned_to', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              required
            >
              <option value="">Select employee…</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.employee_number} — {emp.position}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
              Priority *
            </label>
            <select
              id="priority"
              value={form.priority}
              onChange={(e) => update('priority', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          {/* Zone */}
          <div>
            <label htmlFor="zone_id" className="block text-sm font-medium text-gray-700">
              Zone
            </label>
            <select
              id="zone_id"
              value={form.zone_id}
              onChange={(e) => update('zone_id', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="">No zone</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.zone_name}
                </option>
              ))}
            </select>
          </div>

          {/* Scheduled Start */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="scheduled_start" className="block text-sm font-medium text-gray-700">
                Scheduled Start
              </label>
              <input
                id="scheduled_start"
                type="datetime-local"
                value={form.scheduled_start}
                onChange={(e) => update('scheduled_start', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div>
              <label htmlFor="scheduled_end" className="block text-sm font-medium text-gray-700">
                Scheduled End
              </label>
              <input
                id="scheduled_end"
                type="datetime-local"
                value={form.scheduled_end}
                onChange={(e) => update('scheduled_end', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>

          {/* SOP Reference */}
          <div>
            <label htmlFor="sop_reference" className="block text-sm font-medium text-gray-700">
              SOP Reference
            </label>
            <input
              id="sop_reference"
              type="text"
              value={form.sop_reference}
              onChange={(e) => update('sop_reference', e.target.value)}
              placeholder="e.g. SOP-CUL-001"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* Error */}
          {createTask.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {createTask.error.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={createTask.isPending}>
              {createTask.isPending ? 'Creating…' : 'Create Task'}
            </Button>
            <Link href="/workforce/tasks">
              <Button variant="secondary">Cancel</Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
