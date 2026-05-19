import { NextResponse } from 'next/server';
import { getMergedStream } from '@/lib/services/mediaService';
import { checkIpLimit } from '@/lib/services/rateLimitService';
import { checkAllowedProcessing } from '@/lib/services/complianceService';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');
    const videoItagStr = searchParams.get('videoItag');
    const audioItagStr = searchParams.get('audioItag');
    const filename = searchParams.get('filename') || 'video.mp4';

    if (!url || !videoItagStr || !audioItagStr) {
      return new Response('Missing parameters', { status: 400 });
    }

    const videoItag = parseInt(videoItagStr, 10);
    const audioItag = parseInt(audioItagStr, 10);

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimit = await checkIpLimit(ip);
    
    if (!rateLimit.success) {
      return new Response('Rate limit exceeded. Please wait a minute.', { status: 429 });
    }

    const compliance = await checkAllowedProcessing(url);
    if (!compliance.allowed) {
      return new Response(compliance.reason || 'Forbidden', { status: 403 });
    }

    const stream = await getMergedStream(url, videoItag, audioItag);

    return new Response(stream, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('Error streaming merged video:', error);
    return new Response(error.message || 'Internal Server Error', { status: 500 });
  }
}
