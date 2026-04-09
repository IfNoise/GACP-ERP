import type { SystemRole } from '@gacp-erp/shared-schemas';
import 'next-auth';
import 'next-auth/jwt';

/**
 * Module augmentation for next-auth so that TypeScript understands
 * the extended Session and JWT types used across GACP-ERP.
 */
declare module 'next-auth' {
  interface Session {
    /** Zitadel access token — forwarded to API Gateway in Authorization header */
    accessToken?: string;
    /** Decoded roles from the access token JWT (from Zitadel urn:zitadel:iam:org:project:roles claim) */
    roles: SystemRole[];
    /** Set when token refresh fails ('RefreshAccessTokenError') */
    error?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    roles?: SystemRole[];
    error?: string;
  }
}
