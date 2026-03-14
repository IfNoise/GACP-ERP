import NextAuth from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';
import type { JWT } from 'next-auth/jwt';
import type { Session } from 'next-auth';

/**
 * NextAuth v5 configuration with Keycloak OIDC provider.
 * Token refresh is handled automatically via jwt callback.
 */
const nextAuth = NextAuth({
  providers: [
    KeycloakProvider({
      clientId: process.env['KEYCLOAK_CLIENT_ID'] ?? 'web-portal',
      clientSecret: process.env['KEYCLOAK_CLIENT_SECRET'] ?? '',
      issuer: process.env['KEYCLOAK_ISSUER'] ?? 'http://localhost:8080/realms/gacp-erp',
    }),
  ],

  callbacks: {
    async jwt({ token, account }) {
      // On initial sign-in, persist token data
      if (account) {
        return {
          ...token,
          access_token: account.access_token,
          refresh_token: account.refresh_token,
          expires_at: account.expires_at,
        };
      }

      // Token still valid
      if (Date.now() < ((token['expires_at'] as number) ?? 0) * 1000) {
        return token;
      }

      // Refresh the access token
      return refreshAccessToken(token as JWT & { refresh_token: string });
    },

    async session({ session, token }: { session: Session; token: JWT & Record<string, unknown> }) {
      return {
        ...session,
        accessToken: token['access_token'] as string | undefined,
        error: token['error'] as string | undefined,
      };
    },
  },

  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
});

export const handlers: typeof nextAuth.handlers = nextAuth.handlers;
export const signIn: typeof nextAuth.signIn = nextAuth.signIn;
export const signOut: typeof nextAuth.signOut = nextAuth.signOut;
export const auth: typeof nextAuth.auth = nextAuth.auth;

async function refreshAccessToken(token: JWT & { refresh_token: string }): Promise<JWT> {
  try {
    const url = `${process.env['KEYCLOAK_ISSUER']}/protocol/openid-connect/token`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env['KEYCLOAK_CLIENT_ID'] ?? 'web-portal',
        client_secret: process.env['KEYCLOAK_CLIENT_SECRET'] ?? '',
        refresh_token: token.refresh_token,
      }).toString(),
    });

    const refreshed = (await response.json()) as Record<string, unknown>;

    if (!response.ok) throw refreshed;

    return {
      ...token,
      access_token: refreshed['access_token'] as string,
      expires_at: Math.floor(Date.now() / 1000 + (refreshed['expires_in'] as number)),
      refresh_token: (refreshed['refresh_token'] as string | undefined) ?? token.refresh_token,
    };
  } catch {
    return { ...token, error: 'RefreshAccessTokenError' };
  }
}
