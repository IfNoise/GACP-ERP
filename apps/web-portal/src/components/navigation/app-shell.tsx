'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';

interface AppShellProps {
  readonly children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { session, isLoading } = useAuth();

  // Don't render shell for unauthenticated users (login page etc.)
  if (isLoading || !session) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar — hidden on mobile, visible on lg+ */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
