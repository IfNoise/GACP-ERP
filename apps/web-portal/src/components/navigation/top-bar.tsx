'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { LogoutButton } from '@/components/auth/logout-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@gacp-erp/ui-components';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Sidebar } from './sidebar';

export function TopBar() {
  const { session, roles } = useAuth();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
      {/* Mobile menu (shown only on <lg) */}
      <MobileMenuToggle />

      <div className="hidden lg:block" />

      {/* Right side: user info + sign-out */}
      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 sm:flex">
          {roles.slice(0, 2).map((role) => (
            <Badge key={role} variant="success" className="text-xs">
              {role.replace(/_/g, ' ')}
            </Badge>
          ))}
        </div>
        <span className="text-sm text-gray-600">
          {session?.user?.name ?? session?.user?.email ?? ''}
        </span>
        <LogoutButton />
      </div>
    </header>
  );
}

function MobileMenuToggle() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
            role="button"
            tabIndex={0}
            aria-label="Close navigation"
          />

          {/* Sidebar panel */}
          <div className="relative z-50 animate-slide-in">
            <Sidebar />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
