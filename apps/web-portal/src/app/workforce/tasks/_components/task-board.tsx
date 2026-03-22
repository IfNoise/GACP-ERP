'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTasks, useCompleteTask } from '@/hooks';
import { StatusBadge } from '@gacp-erp/ui-components';
import type { StatusVariant } from '@gacp-erp/ui-components';

const COLUMNS = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'] as const;

const STATUS_VARIANT: Record<string, StatusVariant> = {
  PENDING: 'pending',
  IN_PROGRESS: 'active',
  COMPLETED: 'approved',
  OVERDUE: 'overdue',
};

const PRIORITY_VARIANT: Record<string, StatusVariant> = {
  LOW: 'draft',
  MEDIUM: 'pending',
  HIGH: 'overdue',
  URGENT: 'rejected',
};

export function TaskBoard() {
  const [priorityFilter, setPriorityFilter] = useState('');
  const { data, isLoading } = useTasks({
    limit: 100,
    ...(priorityFilter ? { priority: priorityFilter } : {}),
  });
  const completeMutation = useCompleteTask();

  const allTasks = ((data as Record<string, unknown>)?.['data'] ?? []) as Record<string, unknown>[];

  const handleComplete = async (taskId: string) => {
    await completeMutation.mutateAsync({
      id: taskId,
      body: {} as unknown as Parameters<typeof completeMutation.mutateAsync>[0]['body'],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Board</h1>
          <p className="mt-1 text-sm text-gray-500">Kanban view of workforce tasks</p>
        </div>
        <div className="flex gap-3">
          <select
            className="input w-40"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
          <Link href="/workforce/tasks/new" className="btn btn-primary">
            New Task
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse p-6 text-center">Loading tasks...</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-4">
          {COLUMNS.map((col) => {
            const colTasks = allTasks.filter((t) => String(t['status']) === col);
            return (
              <div key={col} className="rounded-lg bg-gray-100 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <StatusBadge
                    status={STATUS_VARIANT[col] ?? 'draft'}
                    label={col.replace(/_/g, ' ')}
                  />
                  <span className="text-sm text-gray-500">{colTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {colTasks.map((task) => (
                    <div key={String(task['id'])} className="rounded-md bg-white p-3 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">{String(task['title'])}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {String(task['task_number'])}
                          </p>
                        </div>
                        <StatusBadge
                          status={PRIORITY_VARIANT[String(task['priority'])] ?? 'draft'}
                          label={String(task['priority'])}
                        />
                      </div>
                      {task['scheduled_start'] ? (
                        <p className="mt-2 text-xs text-gray-400">
                          Due: {new Date(String(task['scheduled_start'])).toLocaleDateString()}
                        </p>
                      ) : null}
                      {col === 'IN_PROGRESS' && (
                        <button
                          className="mt-2 text-xs text-green-600 hover:text-green-800"
                          onClick={() => handleComplete(String(task['id']))}
                          disabled={completeMutation.isPending}
                        >
                          ✓ Mark Complete
                        </button>
                      )}
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <p className="py-4 text-center text-sm text-gray-400">No tasks</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
