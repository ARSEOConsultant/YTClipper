import { NextRequest, NextResponse } from 'next/server';

// Raw platform hostnames that should never be used directly — only ever
// via the custom domain in NEXT_PUBLIC_APP_URL.
const RAW_PLATFORM_SUFFIXES = ['.onrender.com', '.ondigitalocean.app'];

/**
 * Redirects a raw hosting-platform URL (Render, DigitalOcean, etc.) to the
 * custom domain once one is configured (via NEXT_PUBLIC_APP_URL). Without
 * this, the platform's own URL stays fully usable in parallel — bypassing
 * canonical/SEO signals and any bot protection added only on the custom
 * domain's Cloudflare zone.
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  const isRawPlatformHost = RAW_PLATFORM_SUFFIXES.some((suffix) => host.endsWith(suffix));
  if (!appUrl || !isRawPlatformHost) {
    return NextResponse.next();
  }

  // Guard against a redirect loop: only redirect if NEXT_PUBLIC_APP_URL
  // actually points somewhere other than one of these raw platform hosts.
  // If it's unset, or still set to the platform URL itself, do nothing
  // rather than risk redirecting the site to itself forever.
  let appHost: string;
  try {
    appHost = new URL(appUrl).host;
  } catch {
    return NextResponse.next();
  }
  if (RAW_PLATFORM_SUFFIXES.some((suffix) => appHost.endsWith(suffix))) {
    return NextResponse.next();
  }

  const target = new URL(request.nextUrl.pathname + request.nextUrl.search, appUrl);
  return NextResponse.redirect(target, 301);
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};
