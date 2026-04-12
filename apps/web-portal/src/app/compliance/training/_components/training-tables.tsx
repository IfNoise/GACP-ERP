'use client';

import { DataTable, Badge } from '@gacp-erp/ui-components';
import type { ColumnDef } from '@gacp-erp/ui-components';

interface TrainingExecution {
  id: string;
  course_id: string;
  trainee_id: string;
  status: string;
  score: number | null;
  completed_at: string | null;
  created_at: string;
}

interface Certification {
  id: string;
  employee_id: string;
  course_id: string;
  issued_at: string;
  valid_until: string;
  certificate_number: string;
}

type BadgeVariant = 'success' | 'destructive' | 'info' | 'warning' | 'default';

const STATUS_BADGE: Record<string, BadgeVariant> = {
  COMPLETED: 'success',
  FAILED: 'destructive',
  SCHEDULED: 'info',
  IN_PROGRESS: 'warning',
};

const executionColumns: ColumnDef<TrainingExecution>[] = [
  {
    accessorKey: 'trainee_id',
    header: 'Trainee ID',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-gray-600">
        {row.original.trainee_id.slice(0, 8)}…
      </span>
    ),
  },
  {
    accessorKey: 'course_id',
    header: 'Course ID',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-gray-600">{row.original.course_id.slice(0, 8)}…</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={STATUS_BADGE[row.original.status] ?? 'default'}>{row.original.status}</Badge>
    ),
  },
  {
    accessorKey: 'score',
    header: 'Score',
    cell: ({ row }) => (row.original.score !== null ? `${row.original.score}%` : '—'),
  },
  {
    accessorKey: 'completed_at',
    header: 'Completed',
    cell: ({ row }) =>
      row.original.completed_at ? new Date(row.original.completed_at).toLocaleDateString() : '—',
  },
];

const certificationColumns: ColumnDef<Certification>[] = [
  {
    accessorKey: 'certificate_number',
    header: 'Certificate #',
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.certificate_number}</span>,
  },
  {
    accessorKey: 'employee_id',
    header: 'Employee ID',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-gray-600">
        {row.original.employee_id.slice(0, 8)}…
      </span>
    ),
  },
  {
    accessorKey: 'issued_at',
    header: 'Issued',
    cell: ({ row }) => new Date(row.original.issued_at).toLocaleDateString(),
  },
  {
    accessorKey: 'valid_until',
    header: 'Valid Until',
    cell: ({ row }) => new Date(row.original.valid_until).toLocaleDateString(),
  },
  {
    id: 'cert_status',
    header: 'Status',
    cell: ({ row }) => {
      const expired = new Date(row.original.valid_until) < new Date();
      return (
        <Badge variant={expired ? 'destructive' : 'success'}>{expired ? 'EXPIRED' : 'VALID'}</Badge>
      );
    },
  },
];

export function TrainingExecutionsTable({ data }: { data: TrainingExecution[] }) {
  return (
    <DataTable
      data={data}
      columns={executionColumns}
      pageSize={20}
      searchPlaceholder="Search training executions..."
      emptyMessage="No training records found"
    />
  );
}

export function CertificationsTable({ data }: { data: Certification[] }) {
  return (
    <DataTable
      data={data}
      columns={certificationColumns}
      pageSize={20}
      searchPlaceholder="Search certifications..."
      emptyMessage="No certifications found"
    />
  );
}
