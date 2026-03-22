import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/components/providers/auth-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { auth } from '@/lib/auth';
import './globals.css';

export const metadata: Metadata = {
  title: 'GACP-ERP — Cannabis Cultivation Management',
  description: 'EU GMP, GACP, 21 CFR Part 11 compliant ERP for medicinal cannabis cultivation',
};

interface RootLayoutProps {
  readonly children: ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const session = await auth();

  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider session={session}>
          <QueryProvider>{children}</QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
