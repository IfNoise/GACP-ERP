'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import { JwtPayloadSchema, type JwtPayload, type SystemRole } from '@gacp-erp/shared-schemas';

// ─── Context ──────────────────────────────────────────────────────────────────

interface AuthContextValue {
  /** Full next-auth session */
  session: Session | null;
  /** Roles extracted from Keycloak JWT, validated via JwtPayloadSchema */
  roles: SystemRole[];
  /** True if session is loading */
  isLoading: boolean;
  /** Validated JWT payload (null if validation failed or not authenticated) */
  jwtPayload: JwtPayload | null;
  /** True if token refresh failed */
  hasTokenError: boolean;
  /** Convenience: check whether user has a required role */
  hasRole: (role: SystemRole) => boolean;
  /** Convenience: check whether user has any of the required roles */
  hasAnyRole: (roles: SystemRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Inner consumer (needs to be inside SessionProvider) ──────────────────────

function AuthConsumer({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [jwtPayload, setJwtPayload] = useState<JwtPayload | null>(null);

  const isLoading = status === 'loading';
  const roles: SystemRole[] = session?.roles ?? [];
  const hasTokenError = session?.error === 'RefreshAccessTokenError';

  useEffect(() => {
    if (!session?.accessToken) {
      setJwtPayload(null);
      return;
    }

    // Decode and Zod-validate the JWT payload on the client.
    // This is a defence-in-depth check — the server already verified the signature.
    try {
      const parts = session.accessToken.split('.');
      if (parts.length !== 3 || !parts[1]) {
        setJwtPayload(null);
        return;
      }
      const raw = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      const result = JwtPayloadSchema.safeParse(raw);
      setJwtPayload(result.success ? result.data : null);
    } catch {
      setJwtPayload(null);
    }
  }, [session?.accessToken]);

  const hasRole = (role: SystemRole) => roles.includes(role);
  const hasAnyRole = (required: SystemRole[]) => required.some((r) => roles.includes(r));

  return (
    <AuthContext.Provider
      value={{ session, roles, isLoading, jwtPayload, hasTokenError, hasRole, hasAnyRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Provider (wraps SessionProvider) ────────────────────────────────────────

interface AuthProviderProps {
  readonly children: ReactNode;
  readonly session?: Session | null;
}

/**
 * AuthProvider — wraps next-auth SessionProvider and additionally:
 * 1. Validates the access token JWT payload via JwtPayloadSchema (Zod)
 * 2. Exposes roles and convenience helpers via AuthContext
 *
 * Usage: replace <SessionProvider> in layout.tsx with <AuthProvider>
 */
export function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider session={session ?? null}>
      <AuthConsumer>{children}</AuthConsumer>
    </SessionProvider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Must be used inside <AuthProvider>.
 * Returns roles, jwtPayload, and convenience helpers.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
