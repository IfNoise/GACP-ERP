import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { SystemRole } from '@gacp-erp/shared-schemas';

/**
 * Routes that require specific roles.
 * Key: path prefix, Value: allowed roles (user must have AT LEAST ONE).
 */
const ROLE_PROTECTED_ROUTES: Array<{ prefix: string; roles: SystemRole[] }> = [
  { prefix: '/admin', roles: ['SUPER_ADMIN'] },
  { prefix: '/quality', roles: ['SUPER_ADMIN', 'QUALITY_MANAGER'] },
  { prefix: '/capa', roles: ['SUPER_ADMIN', 'QUALITY_MANAGER'] },
  { prefix: '/audit', roles: ['SUPER_ADMIN', 'QUALITY_MANAGER', 'AUDITOR'] },
  {
    prefix: '/batches',
    roles: ['SUPER_ADMIN', 'QUALITY_MANAGER', 'CULTIVATION_MANAGER', 'OPERATOR'],
  },
  {
    prefix: '/plants',
    roles: ['SUPER_ADMIN', 'QUALITY_MANAGER', 'CULTIVATION_MANAGER', 'OPERATOR'],
  },
];

export default auth(
  (req: Parameters<Parameters<typeof auth>[0]>[0]): ReturnType<Parameters<typeof auth>[0]> => {
    const { nextUrl, auth: session } = req;
    const pathname = nextUrl.pathname;

    // Not authenticated → redirect to login
    if (!session) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check role-based access
    const roles: SystemRole[] = session.roles ?? [];
    for (const route of ROLE_PROTECTED_ROUTES) {
      if (pathname.startsWith(route.prefix)) {
        const hasAccess = route.roles.some((r) => roles.includes(r));
        if (!hasAccess) {
          // Redirect to 403 page
          return NextResponse.redirect(new URL('/auth/unauthorized', req.url));
        }
        break;
      }
    }

    return NextResponse.next();
  },
);

export const config = {
  /*
   * Match all request paths EXCEPT:
   * - _next/static (static files)
   * - _next/image (image optimization)
   * - favicon.ico
   * - /login page (sign-in UI)
   * - /auth/* (NextAuth routes)
   * - /api/auth/* (NextAuth API routes)
   * - /scan/* (QR scan — allow unauthenticated scans, validated server-side)
   */
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login|auth|api/auth|scan).*)'],
};
