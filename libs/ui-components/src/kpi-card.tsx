import { cn } from './utils';
import type { ReactNode } from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: { value: number; label: string };
  className?: string;
}

export function KPICard({ title, value, icon, trend, className }: KPICardProps) {
  const trendPositive = trend && trend.value > 0;
  const trendNegative = trend && trend.value < 0;

  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white p-5', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          <span
            className={cn(
              'inline-flex items-center text-xs font-medium',
              trendPositive && 'text-green-600',
              trendNegative && 'text-red-600',
              !trendPositive && !trendNegative && 'text-gray-500',
            )}
          >
            {trendPositive && '↑'}
            {trendNegative && '↓'}
            {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-gray-400">{trend.label}</span>
        </div>
      )}
    </div>
  );
}

export type { KPICardProps };
