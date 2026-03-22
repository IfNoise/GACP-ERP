'use client';

import { useState, useCallback, type FormEvent } from 'react';
import { Button } from './button';

interface SignatureDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (password: string, reason: string) => void | Promise<void>;
  title?: string;
  description?: string;
  requireReason?: boolean;
  isSubmitting?: boolean;
}

export function SignatureDialog({
  open,
  onClose,
  onConfirm,
  title = 'Electronic Signature',
  description = 'Enter your credentials to confirm this action. This constitutes a legally binding electronic signature per 21 CFR Part 11.',
  requireReason = true,
  isSubmitting = false,
}: SignatureDialogProps) {
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      await onConfirm(password, reason);
      setPassword('');
      setReason('');
    },
    [password, reason, onConfirm],
  );

  const handleClose = useCallback(() => {
    setPassword('');
    setReason('');
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 animate-fade-in"
        onClick={handleClose}
        aria-hidden
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl animate-slide-in">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-5 w-5 text-green-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="sig-password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="sig-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Enter your password"
            />
          </div>

          {requireReason && (
            <div className="space-y-1.5">
              <label htmlFor="sig-reason" className="block text-sm font-medium text-gray-700">
                Reason for signing
              </label>
              <textarea
                id="sig-reason"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="e.g. Approve change control CC-2024-001"
                rows={2}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !password || (requireReason && !reason)}
            >
              {isSubmitting ? 'Signing...' : 'Sign & Confirm'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export type { SignatureDialogProps };
