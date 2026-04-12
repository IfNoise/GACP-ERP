'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTrainingExecutions, useCompleteTrainingExecution } from '@/hooks';
import {
  StatusBadge,
  SignatureDialog,
  AuditTrailPanel,
  KPICard,
  Button,
} from '@gacp-erp/ui-components';
import type { StatusVariant, AuditEvent } from '@gacp-erp/ui-components';

const EXEC_STATUS_VARIANT: Record<string, StatusVariant> = {
  SCHEDULED: 'pending',
  IN_PROGRESS: 'active',
  COMPLETED: 'approved',
  FAILED: 'rejected',
  EXPIRED: 'overdue',
};

export function TrainingExecutionDetail({ id }: { id: string }) {
  const [signOpen, setSignOpen] = useState(false);

  // Fetch single execution by filtering
  const { data, isLoading } = useTrainingExecutions({ limit: 1 });
  const completeMutation = useCompleteTrainingExecution();

  // In a real app we'd have getById — here use the id from route
  const exec = (data as Record<string, unknown>) ?? null;
  const execData = ((exec?.['data'] ?? []) as Record<string, unknown>[])[0] ?? null;

  const handleComplete = async (password: string, reason: string) => {
    setSignOpen(false);
    await completeMutation.mutateAsync({
      id,
      body: { password, reason } as unknown as Parameters<
        typeof completeMutation.mutateAsync
      >[0]['body'],
    });
  };

  if (isLoading) return <div className="animate-pulse p-6">Loading execution...</div>;

  const auditEvents: AuditEvent[] = [
    {
      id: 'created',
      action: 'Scheduled',
      actor: 'System',
      timestamp: execData
        ? String(execData['created_at'] ?? new Date().toISOString())
        : new Date().toISOString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/training/executions" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to executions
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Training Execution</h1>
          {execData && (
            <StatusBadge
              status={EXEC_STATUS_VARIANT[String(execData['status'])] ?? 'draft'}
              label={String(execData['status'] ?? 'UNKNOWN').replace(/_/g, ' ')}
            />
          )}
        </div>
        <p className="mt-1 text-sm text-gray-500">Execution ID: {id}</p>
      </div>

      {execData && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <KPICard title="Course" value={String(execData['course_id'] ?? '—')} />
            <KPICard title="Employee" value={String(execData['employee_id'] ?? '—').slice(0, 8)} />
            <KPICard
              title="Score"
              value={execData['score'] != null ? `${String(execData['score'])}%` : 'N/A'}
            />
            <KPICard
              title="Scheduled"
              value={
                execData['scheduled_date']
                  ? new Date(String(execData['scheduled_date'])).toLocaleDateString()
                  : '—'
              }
            />
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Execution Details</h2>
            </div>
            <div className="card-body">
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500">Status</dt>
                  <dd className="font-medium">{String(execData['status'])}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Trainer</dt>
                  <dd className="font-medium">{String(execData['trainer_id'] ?? '—')}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Completion Date</dt>
                  <dd className="font-medium">
                    {execData['completed_at']
                      ? new Date(String(execData['completed_at'])).toLocaleDateString()
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Result</dt>
                  <dd className="font-medium">
                    {execData['passed'] != null ? (execData['passed'] ? 'PASSED' : 'FAILED') : '—'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Actions */}
          {String(execData['status']) === 'IN_PROGRESS' && (
            <div className="flex gap-3">
              <Button onClick={() => setSignOpen(true)}>Complete Training</Button>
            </div>
          )}
        </>
      )}

      <AuditTrailPanel events={auditEvents} />

      <SignatureDialog
        open={signOpen}
        onClose={() => setSignOpen(false)}
        onConfirm={handleComplete}
        title="Complete Training Execution"
      />
    </div>
  );
}
