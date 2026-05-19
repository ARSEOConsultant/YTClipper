import { NextResponse } from 'next/server';
import { getMediaDownloadUrl } from '@/lib/services/mediaService';
import { checkIpLimit } from '@/lib/services/rateLimitService';
import { checkAllowedProcessing } from '@/lib/services/complianceService';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimit = await checkIpLimit(ip);
    
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please wait a minute.' }, { status: 429 });
    }

    const { url, itag } = await req.json();

    if (!url || typeof itag !== 'number') {
      return NextResponse.json({ error: 'URL and itag are required' }, { status: 400 });
    }

    const compliance = await checkAllowedProcessing(url);
    if (!compliance.allowed) {
      return NextResponse.json({ error: compliance.reason }, { status: 403 });
    }

    const result = await getMediaDownloadUrl(url, itag);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Media download error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
