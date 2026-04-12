'use client';

import Link from 'next/link';
import {
  useEmployee,
  useEmployeeCompetency,
  useTasks,
  useTimeEntries,
  useCertifications,
} from '@/hooks';
import { StatusBadge, AuditTrailPanel, KPICard, DataTable } from '@gacp-erp/ui-components';
import type { StatusVariant, AuditEvent, ColumnDef } from '@gacp-erp/ui-components';

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

const TASK_COLUMNS: ColumnDef<Record<string, unknown>>[] = [
  {
    accessorKey: 'title',
    header: 'Task',
    cell: ({ row }) => String(row.original['title']),
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    cell: ({ row }) => (
      <StatusBadge
        status={PRIORITY_VARIANT[String(row.original['priority'])] ?? 'draft'}
        label={String(row.original['priority'])}
      />
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <StatusBadge
        status={TASK_STATUS_VARIANT[String(row.original['status'])] ?? 'draft'}
        label={String(row.original['status'])}
      />
    ),
  },
];

const CERT_COLUMNS: ColumnDef<Record<string, unknown>>[] = [
  {
    accessorKey: 'certificate_number',
    header: 'Certificate #',
    cell: ({ row }) => (
      <span className="font-mono">{String(row.original['certificate_number'])}</span>
    ),
  },
  {
    accessorKey: 'course_id',
    header: 'Course',
    cell: ({ row }) => `${String(row.original['course_id']).slice(0, 8)}…`,
  },
  {
    accessorKey: 'valid_until',
    header: 'Valid Until',
    cell: ({ row }) => new Date(String(row.original['valid_until'])).toLocaleDateString(),
  },
  {
    id: 'cert_status',
    header: 'Status',
    cell: ({ row }) => {
      const validUntil = new Date(String(row.original['valid_until']));
      const now = new Date();
      const daysLeft = Math.ceil((validUntil.getTime() - now.getTime()) / 86400000);
      const certStatus: StatusVariant =
        daysLeft < 0 ? 'rejected' : daysLeft < 30 ? 'overdue' : 'approved';
      const certLabel = daysLeft < 0 ? 'Expired' : daysLeft < 30 ? 'Expiring' : 'Valid';
      return <StatusBadge status={certStatus} label={certLabel} />;
    },
  },
];

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
          <h1 className="text-2xl font-bold text-gray-900">
            {String(emp['first_name'] ?? '')} {String(emp['last_name'] ?? '')}
          </h1>
          <StatusBadge
            status={emp['is_active'] ? 'active' : 'closed'}
            label={emp['is_active'] ? 'Active' : 'Inactive'}
          />
        </div>
        <p className="mt-1 text-lg text-gray-700">
          {String(emp['employee_number'])} — {String(emp['position'])} — {String(emp['department'])}
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
                <dt className="text-gray-500">Name</dt>
                <dd className="font-medium">
                  {String(emp['first_name'] ?? '')} {String(emp['last_name'] ?? '')}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd className="font-medium">{String(emp['email'] ?? '—')}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Position</dt>
                <dd className="font-medium">{String(emp['position'])}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Department</dt>
                <dd className="font-medium">{String(emp['department'])}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Employee #</dt>
                <dd className="font-medium font-mono">{String(emp['employee_number'])}</dd>
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
          <DataTable<Record<string, unknown>>
            data={tasks}
            columns={TASK_COLUMNS}
            pageSize={10}
            searchPlaceholder="Search tasks..."
            emptyMessage="No tasks assigned"
          />
        </div>
      </div>

      {/* Certifications */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Certifications ({certs.length})</h2>
        </div>
        <div className="card-body">
          <DataTable<Record<string, unknown>>
            data={certs}
            columns={CERT_COLUMNS}
            pageSize={20}
            searchPlaceholder="Search certifications..."
            emptyMessage="No certifications found"
          />
        </div>
      </div>

      <AuditTrailPanel events={auditEvents} />
    </div>
  );
}
