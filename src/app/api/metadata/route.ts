import { NextResponse } from 'next/server';
import { getVideoMetadata } from '@/lib/services/youtubeService';
import { checkAllowedProcessing } from '@/lib/services/complianceService';
import { checkIpLimit } from '@/lib/services/rateLimitService';

export async function POST(request: Request) {
  console.log('[METADATA] POST request received');
  try {
    console.log('[METADATA] Parsing request...');
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    console.log('[METADATA] Checking rate limit for IP:', ip);
    const rateLimit = await checkIpLimit(ip, 'metadata');
    if (!rateLimit.success) {
      console.log('[METADATA] Rate limit exceeded');
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute and try again.' },
        { status: 429, headers: { 'Retry-After': '60' } },
      );
    }

    console.log('[METADATA] Reading request body...');
    const { url } = await request.json();
    if (!url) {
      console.log('[METADATA] No URL provided');
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log('[METADATA] Checking compliance for URL:', url);
    const allowed = await checkAllowedProcessing(url);
    if (!allowed.allowed) {
      console.log('[METADATA] Compliance check failed:', allowed.reason);
      return NextResponse.json({ error: allowed.reason }, { status: 403 });
    }

    console.log('[METADATA] Fetching video metadata for URL:', url);
    const result = await getVideoMetadata(url);

    console.log('[METADATA] Metadata result success:', result.success);
    if (!result.success) {
      console.log('[METADATA] Errors:', result.errors);
      return NextResponse.json(
        {
          error: 'Failed to fetch metadata from all sources',
          details: result.errors,
          cookiesStatus: {
            exists: !!process.env.YOUTUBE_COOKIES,
            length: process.env.YOUTUBE_COOKIES?.trim().length || 0,
          }
        },
        { status: 500 }
      );
    }

    console.log('[METADATA] Successfully returning metadata');
    return NextResponse.json(result.metadata);
  } catch (error: any) {
    console.error('[API/METADATA] Unexpected exception in POST handler:', error.message || error);
    console.error('[API/METADATA] Stack:', error.stack);
    return NextResponse.json(
      {
        error: 'Internal server error',
        exception: error.message || error,
        cookiesStatus: {
          exists: !!process.env.YOUTUBE_COOKIES,
          length: process.env.YOUTUBE_COOKIES?.trim().length || 0,
        }
      },
      { status: 500 }
    );
  }
}
