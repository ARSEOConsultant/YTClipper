import { NextResponse } from 'next/server';
import { getVideoMetadata } from '@/lib/services/youtubeService';
import { checkAllowedProcessing } from '@/lib/services/complianceService';
import { checkIpLimit } from '@/lib/services/rateLimitService';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const rateLimit = await checkIpLimit(ip, 'metadata');
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute and try again.' },
        { status: 429, headers: { 'Retry-After': '60' } },
      );
    }

    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const allowed = await checkAllowedProcessing(url);
    if (!allowed.allowed) {
      return NextResponse.json({ error: allowed.reason }, { status: 403 });
    }

    const result = await getVideoMetadata(url);
    if (!result.success) {
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

    return NextResponse.json(result.metadata);
  } catch (error: any) {
    console.error('[API/METADATA] Unexpected exception in POST handler:', error);
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
