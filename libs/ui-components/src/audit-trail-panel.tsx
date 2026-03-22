'use client';

import { useState } from 'react';
import { cn } from './utils';

interface AuditEvent {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  details?: string;
  metadata?: Record<string, unknown>;
}

interface AuditTrailPanelProps {
  events: AuditEvent[];
  title?: string;
  className?: string;
  defaultCollapsed?: boolean;
}

export function AuditTrailPanel({
  events,
  title = 'Audit Trail',
  className,
  defaultCollapsed = true,
}: AuditTrailPanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white', className)}>
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          <svg
            className="h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm font-semibold text-gray-900">{title}</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
            {events.length}
          </span>
        </div>
        <svg
          className={cn('h-4 w-4 text-gray-400 transition-transform', !collapsed && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {!collapsed && (
        <div className="border-t border-gray-200 px-4 py-3">
          {events.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">No audit events recorded.</p>
          ) : (
            <div className="relative space-y-0">
              {/* Vertical line */}
              <div className="absolute left-3 top-2 bottom-2 w-px bg-gray-200" />

              {events.map((event) => (
                <div key={event.id} className="relative flex gap-3 py-2 pl-2">
                  {/* Dot */}
                  <div className="relative z-10 mt-1.5 h-2 w-2 shrink-0 rounded-full bg-green-500 ring-2 ring-white" />

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-medium text-gray-900">{event.action}</span>
                      <time className="shrink-0 text-xs text-gray-400">{event.timestamp}</time>
                    </div>
                    <span className="text-xs text-gray-500">by {event.actor}</span>
                    {event.details && (
                      <p className="mt-0.5 text-xs text-gray-500">{event.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export type { AuditEvent, AuditTrailPanelProps };
