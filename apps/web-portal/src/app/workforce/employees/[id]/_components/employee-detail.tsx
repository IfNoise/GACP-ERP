'use client';

import Link from 'next/link';
import {
  useEmployee,
  useEmployeeCompetency,
  useTasks,
  useTimeEntries,
  useCertifications,
} from '@/hooks';
import { StatusBadge, AuditTrailPanel, KPICard } from '@gacp-erp/ui-components';
import type { StatusVariant, AuditEvent } from '@gacp-erp/ui-components';

const PRIORITY_VARIANT: Record<string, StatusVariant> = {
  LOW: 'draft',
  MEDIUM: 'pending',
  HIGH: 'overdue',
  URGENT: 'rejected',
};

const TASK_STATUS_VARIANT: Record<string, StatusVariant> = {
  PENDING: 'pending',
  IN_PROGRESS: 'active',
  COMPLETED: 'approved',
  OVERDUE: 'overdue',
};

export function EmployeeDetail({ id }: { id: string }) {
  const { data, isLoading } = useEmployee(id);
  const { data: competency } = useEmployeeCompetency(id);
  const { data: tasksData } = useTasks({ assigned_to: id, limit: 10 });
  const { data: timeData } = useTimeEntries({ employee_id: id, limit: 10 });
  const { data: certsData } = useCertifications({ employee_id: id, limit: 20 });

  if (isLoading) return <div className="animate-pulse p-6">Loading employee...</div>;
  if (!data) return <div className="p-6 text-red-600">Employee not found</div>;

  const emp = data as Record<string, unknown>;
  const tasks = ((tasksData as Record<string, unknown>)?.['data'] ?? []) as Record<
    string,
    unknown
  >[];
  const timeEntries = ((timeData as Record<string, unknown>)?.['data'] ?? []) as Record<
    string,
    unknown
  >[];
  const certs = ((certsData as Record<string, unknown>)?.['data'] ?? []) as Record<
    string,
    unknown
  >[];
  const comp = competency as Record<string, unknown> | null;

  const auditEvents: AuditEvent[] = [
    {
      id: 'created',
      action: 'Created',
      actor: String(emp['created_by'] ?? ''),
      timestamp: String(emp['created_at']),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/workforce/employees" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to employees
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{String(emp['employee_number'])}</h1>
          <StatusBadge
            status={emp['is_active'] ? 'active' : 'closed'}
            label={emp['is_active'] ? 'Active' : 'Inactive'}
          />
        </div>
        <p className="mt-1 text-lg text-gray-700">
          {String(emp['position'])} — {String(emp['department'])}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Assigned Tasks" value={String(tasks.length)} />
        <KPICard title="Time Entries" value={String(timeEntries.length)} />
        <KPICard title="Certifications" value={String(certs.length)} />
        <KPICard
          title="Hire Date"
          value={new Date(String(emp['hire_date'])).toLocaleDateString()}
        />
      </div>

      {/* Employee Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Details</h2>
          </div>
          <div className="card-body">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Position</dt>
                <dd className="font-medium">{String(emp['position'])}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Department</dt>
                <dd className="font-medium">{String(emp['department'])}</dd>
              </div>
              <div>
                <dt className="text-gray-500">User ID</dt>
                <dd className="font-medium">{String(emp['user_id'] ?? '—')}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Hire Date</dt>
                <dd className="font-medium">
                  {new Date(String(emp['hire_date'])).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Competency Profile */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Competency Profile</h2>
          </div>
          <div className="card-body">
            {comp ? (
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-gray-500">Position</dt>
                  <dd className="font-medium">{String(comp['position'] ?? '—')}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Required Courses</dt>
                  <dd className="font-medium">
                    {((comp['required_courses'] ?? []) as string[]).length} courses
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-gray-500">No competency profile assigned</p>
            )}
          </div>
        </div>
      </div>

      {/* Assigned Tasks */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Recent Tasks ({tasks.length})</h2>
        </div>
        <div className="card-body">
          {tasks.length === 0 ? (
            <p className="text-sm text-gray-500">No tasks assigned</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">Task</th>
                  <th className="pb-2">Priority</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={String(t['id'])} className="border-b">
                    <td className="py-2">{String(t['title'])}</td>
                    <td className="py-2">
                      <StatusBadge
                        status={PRIORITY_VARIANT[String(t['priority'])] ?? 'draft'}
                        label={String(t['priority'])}
                      />
                    </td>
                    <td className="py-2">
                      <StatusBadge
                        status={TASK_STATUS_VARIANT[String(t['status'])] ?? 'draft'}
                        label={String(t['status'])}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Certifications */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Certifications ({certs.length})</h2>
        </div>
        <div className="card-body">
          {certs.length === 0 ? (
            <p className="text-sm text-gray-500">No certifications found</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">Certificate #</th>
                  <th className="pb-2">Course</th>
                  <th className="pb-2">Valid Until</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {certs.map((c) => {
                  const validUntil = new Date(String(c['valid_until']));
                  const now = new Date();
                  const daysLeft = Math.ceil((validUntil.getTime() - now.getTime()) / 86400000);
                  const certStatus: StatusVariant =
                    daysLeft < 0 ? 'rejected' : daysLeft < 30 ? 'overdue' : 'approved';
                  const certLabel = daysLeft < 0 ? 'Expired' : daysLeft < 30 ? 'Expiring' : 'Valid';
                  return (
                    <tr key={String(c['id'])} className="border-b">
                      <td className="py-2 font-mono">{String(c['certificate_number'])}</td>
                      <td className="py-2">{String(c['course_id']).slice(0, 8)}…</td>
                      <td className="py-2">{validUntil.toLocaleDateString()}</td>
                      <td className="py-2">
                        <StatusBadge status={certStatus} label={certLabel} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AuditTrailPanel events={auditEvents} />
    </div>
  );
}
