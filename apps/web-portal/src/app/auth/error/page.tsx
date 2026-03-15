import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ErrorPageProps {
  searchParams: Promise<{ error?: string }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: 'Server configuration error. Contact your system administrator.',
  AccessDenied: 'Access was denied. You do not have permission to sign in.',
  Verification: 'The sign-in link has expired or has already been used.',
  RefreshAccessTokenError: 'Your session has expired. Please sign in again.',
  Default: 'An unexpected authentication error occurred.',
};

export default async function AuthErrorPage({ searchParams }: ErrorPageProps) {
  const { error } = await searchParams;
  const message = ERROR_MESSAGES[error ?? 'Default'] ?? ERROR_MESSAGES['Default'];

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-xl border border-red-200 bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Authentication Error</h1>
          {error && <p className="mt-1 text-xs font-mono text-gray-400">{error}</p>}
        </div>

        <p className="mb-6 text-center text-sm text-gray-600">{message}</p>

        <Link href="/login">
          <Button className="w-full">Return to Login</Button>
        </Link>
      </div>
    </main>
  );
}
