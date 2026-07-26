import { NextRequest, NextResponse } from 'next/server';

/**
 * Redirects the raw Render URL to the custom domain once one is configured
 * (via NEXT_PUBLIC_APP_URL). Without this, the onrender.com URL stays fully
 * usable in parallel — bypassing canonical/SEO signals and any bot
 * protection added only on the custom domain's Cloudflare zone.
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl || !host.endsWith('.onrender.com')) {
    return NextResponse.next();
  }

  // Guard against a redirect loop: only redirect if NEXT_PUBLIC_APP_URL
  // actually points somewhere other than onrender.com. If it's unset, or
  // still set to the Render URL itself, do nothing rather than risk
  // redirecting the site to itself forever.
  let appHost: string;
  try {
    appHost = new URL(appUrl).host;
  } catch {
    return NextResponse.next();
  }
  if (appHost.endsWith('.onrender.com')) {
    return NextResponse.next();
  }

  const target = new URL(request.nextUrl.pathname + request.nextUrl.search, appUrl);
  return NextResponse.redirect(target, 301);
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};
