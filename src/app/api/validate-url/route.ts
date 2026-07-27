import { NextResponse } from 'next/server';
import { parseYouTubeUrl } from '@/lib/services/youtubeService';
import { checkIpLimit } from '@/lib/services/rateLimitService';
import { verifyTurnstileToken } from '@/lib/services/turnstileService';

export async function POST(request: Request) {
  console.log('[VALIDATE-URL] POST request received');
  try {
    console.log('[VALIDATE-URL] Getting IP...');
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    console.log('[VALIDATE-URL] Checking rate limit for IP:', ip);
    const rateLimit = await checkIpLimit(ip);

    if (!rateLimit.success) {
      console.log('[VALIDATE-URL] Rate limit exceeded');
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    console.log('[VALIDATE-URL] Reading request body...');
    const { url, turnstileToken } = await request.json();
    if (!url) {
      console.log('[VALIDATE-URL] No URL provided');
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const clientIp = ip.split(',')[0].trim();
    const humanVerified = await verifyTurnstileToken(turnstileToken, clientIp);
    if (!humanVerified) {
      console.log('[VALIDATE-URL] Turnstile verification failed');
      return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 403 });
    }

    console.log('[VALIDATE-URL] Parsing URL:', url);
    const parsed = parseYouTubeUrl(url);
    if (!parsed) {
      console.log('[VALIDATE-URL] URL parsing failed');
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    console.log('[VALIDATE-URL] Successfully parsed:', parsed);
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('[VALIDATE-URL] Exception:', error.message || error);
    console.error('[VALIDATE-URL] Stack:', error.stack);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
