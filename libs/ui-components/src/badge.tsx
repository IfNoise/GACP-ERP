import type { ReactNode } from 'react';
import { cn } from './utils';

type Variant = 'default' | 'success' | 'warning' | 'destructive' | 'outline' | 'info';

const variantClasses: Record<Variant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  destructive: 'bg-red-100 text-red-800',
  outline: 'border border-gray-300 text-gray-700',
  info: 'bg-blue-100 text-blue-800',
};

interface BadgeProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
