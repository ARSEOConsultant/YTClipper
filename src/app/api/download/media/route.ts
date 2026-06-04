import { NextResponse } from 'next/server';
import { getMediaDownloadUrl } from '@/lib/services/mediaService';
import { checkIpLimit } from '@/lib/services/rateLimitService';
import { checkAllowedProcessing } from '@/lib/services/complianceService';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const rateLimit = await checkIpLimit(ip, 'download');

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute and try again.' },
        { status: 429, headers: { 'Retry-After': '60' } },
      );
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
