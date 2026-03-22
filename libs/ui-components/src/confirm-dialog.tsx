'use client';

import { cn } from './utils';
import { Button } from './button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  isSubmitting?: boolean;
}

const variantStyles = {
  danger: {
    icon: 'bg-red-100 text-red-600',
    button: 'destructive' as const,
  },
  warning: {
    icon: 'bg-amber-100 text-amber-600',
    button: 'default' as const,
  },
  default: {
    icon: 'bg-green-100 text-green-600',
    button: 'default' as const,
  },
} as const;

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isSubmitting = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  const style = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 animate-fade-in" onClick={onClose} aria-hidden />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl animate-slide-in">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              style.icon,
            )}
          >
            {variant === 'danger' ? (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            {cancelLabel}
          </Button>
          <Button variant={style.button} size="sm" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export type { ConfirmDialogProps };
