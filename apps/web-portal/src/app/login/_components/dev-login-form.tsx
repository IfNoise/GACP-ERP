'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import type { SystemRole } from '@gacp-erp/shared-schemas';

const DEV_ROLES: SystemRole[] = [
  'SUPER_ADMIN',
  'QUALITY_MANAGER',
  'CULTIVATION_MANAGER',
  'OPERATOR',
  'AUDITOR',
  'READONLY',
];

export function DevLoginForm() {
  const [loading, setLoading] = useState<string | null>(null);

  function handleSignIn(role: SystemRole) {
    setLoading(role);
    void signIn('dev-credentials', { role, callbackUrl: '/' });
  }

  return (
    <div className="space-y-2">
      <p className="mb-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700">
        Dev mode — select a role to sign in without Zitadel
      </p>
      {DEV_ROLES.map((role) => (
        <Button
          key={role}
          onClick={() => handleSignIn(role)}
          disabled={loading !== null}
          variant="outline"
          className="w-full justify-start font-mono text-xs"
        >
          {loading === role ? 'Signing in…' : role}
        </Button>
      ))}
    </div>
  );
}
