import { NextResponse } from 'next/server';
import { parseYouTubeUrl } from '@/lib/services/youtubeService';
import { checkIpLimit } from '@/lib/services/rateLimitService';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = await checkIpLimit(ip);
    
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const parsed = parseYouTubeUrl(url);
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
