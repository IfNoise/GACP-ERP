export { auth as middleware } from '@/lib/auth';

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
