import { NextResponse, type NextRequest } from 'next/server';

/**
 * Simple shared-password gate for the internal admin UI.
 * On success a signed-ish cookie (the password value) is set; we compare it
 * against ADMIN_PASSWORD on each request. Good enough for an internal tool;
 * swap for Supabase Auth / SSO if you need per-user accounts.
 */
const COOKIE = 'pm_auth';

export function middleware(req: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;

  // If no password configured, leave the app open (e.g. local dev).
  if (!password) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/login') || pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(COOKIE)?.value;
  if (cookie === password) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('from', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
