import NextAuth from 'next-auth';
import { type OAuthConfig, type OAuthUserConfig } from 'next-auth/providers';
import type { JWT } from 'next-auth/jwt';
import type { Session } from 'next-auth';
import { SystemRoleEnum, type SystemRole } from '@gacp-erp/shared-schemas';

/**
 * Zitadel OIDC provider configuration.
 * NextAuth doesn't have built-in Zitadel provider, so we use generic OIDC.
 */
interface ZitadelProfile {
  sub: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  email_verified: boolean;
}

const ZitadelProvider: OAuthConfig<ZitadelProfile> = {
  id: 'zitadel',
  name: 'Zitadel',
  type: 'oidc',
  issuer: process.env['ZITADEL_ISSUER'] ?? 'http://localhost:8080',
  clientId: process.env['ZITADEL_CLIENT_ID'] ?? 'web-portal',
  clientSecret: process.env['ZITADEL_CLIENT_SECRET'] ?? '',
  authorization: {
    params: {
      // Request Zitadel-specific scopes to get role claims in the access token.
      // urn:zitadel:iam:org:projects:roles  → include role grants claim in JWT
      // urn:zitadel:iam:org:project:id:*:aud → add project as JWT audience (validates in api-gateway)
      scope: [
        'openid profile email',
        'urn:zitadel:iam:org:projects:roles',
        ...(process.env['ZITADEL_PROJECT_ID']
          ? [`urn:zitadel:iam:org:project:id:${process.env['ZITADEL_PROJECT_ID']}:aud`]
          : []),
      ].join(' '),
    },
  },
  userinfo: {
    url: `${process.env['ZITADEL_ISSUER'] ?? 'http://localhost:8080'}/oidc/v1/userinfo`,
  },
  profile(profile: ZitadelProfile) {
    return {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      image: null,
    };
  },
} as OAuthConfig<ZitadelProfile> & OAuthUserConfig<ZitadelProfile>;

/**
 * NextAuth v5 configuration with Zitadel OIDC provider.
 * Token refresh is handled automatically via jwt callback.
 */
const nextAuth = NextAuth({
  providers: [ZitadelProvider],

  callbacks: {
    async jwt({ token, account }): Promise<JWT> {
      // On initial sign-in, persist token data and extract roles
      if (account) {
        // Decode roles from access_token JWT payload (Zitadel custom claims)
        const roles = extractRolesFromToken(account.access_token);
        return {
          ...token,
          // Use conditional spread to satisfy exactOptionalPropertyTypes:
          // undefined values must be absent, not explicitly set to undefined.
          ...(account.access_token !== undefined ? { access_token: account.access_token } : {}),
          ...(account.refresh_token !== undefined ? { refresh_token: account.refresh_token } : {}),
          ...(account.expires_at !== undefined ? { expires_at: account.expires_at } : {}),
          roles,
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
        roles: (token['roles'] as Session['roles']) ?? [],
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
    const zitadelUrl = process.env['ZITADEL_ISSUER'] ?? 'http://localhost:8080';
    const url = `${zitadelUrl}/oauth/v2/token`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env['ZITADEL_CLIENT_ID'] ?? 'web-portal',
        client_secret: process.env['ZITADEL_CLIENT_SECRET'] ?? '',
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
      roles: extractRolesFromToken(refreshed['access_token'] as string | undefined),
    };
  } catch {
    return { ...token, error: 'RefreshAccessTokenError' };
  }
}

/**
 * Decodes Zitadel JWT payload (base64url) and extracts roles from custom claim.
 * Zitadel stores roles in: urn:zitadel:iam:org:project:roles
 */
function extractRolesFromToken(accessToken: string | undefined): SystemRole[] {
  if (!accessToken) return [];
  try {
    const parts = accessToken.split('.');
    if (parts.length !== 3 || !parts[1]) return [];
    // base64url → base64 → JSON
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'),
    ) as {
      'urn:zitadel:iam:org:project:roles'?: Record<string, unknown>;
    };

    // Zitadel stores roles as { roleId: [roleName, ...] }
    const zitadelRoles = payload['urn:zitadel:iam:org:project:roles'] ?? {};
    const rawRoles = Object.values(zitadelRoles).flat() as string[];

    return rawRoles.filter((r): r is SystemRole =>
      SystemRoleEnum.options.includes(r as SystemRole),
    );
  } catch {
    return [];
  }
}
