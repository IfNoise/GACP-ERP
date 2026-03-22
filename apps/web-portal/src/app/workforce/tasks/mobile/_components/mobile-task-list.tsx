'use client';

import { useTasks, useCompleteTask } from '@/hooks';
import { StatusBadge } from '@gacp-erp/ui-components';
import type { StatusVariant } from '@gacp-erp/ui-components';

const PRIORITY_VARIANT: Record<string, StatusVariant> = {
  LOW: 'draft',
  MEDIUM: 'pending',
  HIGH: 'overdue',
  URGENT: 'rejected',
};

const STATUS_VARIANT: Record<string, StatusVariant> = {
  PENDING: 'pending',
  IN_PROGRESS: 'active',
  COMPLETED: 'approved',
  OVERDUE: 'overdue',
};

export function MobileTaskList() {
  const { data, isLoading } = useTasks({ limit: 50 });
  const completeMutation = useCompleteTask();

  const tasks = ((data as Record<string, unknown>)?.['data'] ?? []) as Record<string, unknown>[];
  const activeTasks = tasks.filter((t) => ['PENDING', 'IN_PROGRESS'].includes(String(t['status'])));

  const handleComplete = async (taskId: string) => {
    await completeMutation.mutateAsync({
      id: taskId,
      body: {} as unknown as Parameters<typeof completeMutation.mutateAsync>[0]['body'],
    });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">My Tasks</h1>

      {isLoading ? (
        <div className="animate-pulse p-6 text-center">Loading...</div>
      ) : activeTasks.length === 0 ? (
        <div className="rounded-lg bg-white p-6 text-center text-gray-500">No active tasks</div>
      ) : (
        <div className="space-y-3">
          {activeTasks.map((task) => (
            <div key={String(task['id'])} className="rounded-lg bg-white p-4 shadow">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-medium">{String(task['title'])}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge
                      status={STATUS_VARIANT[String(task['status'])] ?? 'draft'}
                      label={String(task['status']).replace(/_/g, ' ')}
                    />
                    <StatusBadge
                      status={PRIORITY_VARIANT[String(task['priority'])] ?? 'draft'}
                      label={String(task['priority'])}
                    />
                  </div>
                  {task['scheduled_start'] ? (
                    <p className="mt-2 text-sm text-gray-500">
                      Due: {new Date(String(task['scheduled_start'])).toLocaleDateString()}
                    </p>
                  ) : null}
                </div>
              </div>
              {String(task['status']) === 'IN_PROGRESS' && (
                <button
                  className="mt-3 w-full rounded-lg bg-green-600 py-3 text-center font-medium text-white active:bg-green-700"
                  onClick={() => handleComplete(String(task['id']))}
                  disabled={completeMutation.isPending}
                >
                  ✓ Complete Task
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
