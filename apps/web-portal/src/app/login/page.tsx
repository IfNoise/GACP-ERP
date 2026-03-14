import { signIn } from '@/lib/auth';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">GACP-ERP</h1>
          <p className="mt-2 text-sm text-gray-500">Cannabis Cultivation Management</p>
        </div>

        <form
          action={async () => {
            'use server';
            await signIn('keycloak', { redirectTo: '/' });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-lg bg-green-700 px-4 py-3 text-sm font-semibold
                       text-white transition hover:bg-green-800 focus:outline-none
                       focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Sign in with Keycloak
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          Access restricted to authorised personnel only.
          <br />
          All sessions are logged per 21 CFR Part 11.
        </p>
      </div>
    </main>
  );
}
