import { cn } from './utils';

interface WorkflowStep {
  id: string;
  label: string;
  status: 'completed' | 'active' | 'pending';
  timestamp?: string;
}

interface WorkflowTimelineProps {
  steps: WorkflowStep[];
  className?: string;
}

const statusStyles = {
  completed: {
    circle: 'bg-green-600 text-white',
    line: 'bg-green-600',
    label: 'text-green-700 font-medium',
  },
  active: {
    circle: 'bg-blue-600 text-white ring-4 ring-blue-100',
    line: 'bg-gray-200',
    label: 'text-blue-700 font-semibold',
  },
  pending: {
    circle: 'bg-gray-200 text-gray-400',
    line: 'bg-gray-200',
    label: 'text-gray-400',
  },
} as const;

export function WorkflowTimeline({ steps, className }: WorkflowTimelineProps) {
  return (
    <div className={cn('flex items-start', className)}>
      {steps.map((step, index) => {
        const style = statusStyles[step.status];
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {/* Left connector */}
              {index > 0 && (
                <div
                  className={cn(
                    'h-0.5 flex-1',
                    steps[index - 1]!.status === 'completed' ? 'bg-green-600' : 'bg-gray-200',
                  )}
                />
              )}

              {/* Circle */}
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all',
                  style.circle,
                )}
              >
                {step.status === 'completed' ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>

              {/* Right connector */}
              {!isLast && <div className={cn('h-0.5 flex-1', style.line)} />}
            </div>

            {/* Label & timestamp */}
            <div className="mt-2 text-center">
              <span className={cn('block text-xs', style.label)}>{step.label}</span>
              {step.timestamp && (
                <span className="block text-[10px] text-gray-400">{step.timestamp}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export type { WorkflowStep, WorkflowTimelineProps };
