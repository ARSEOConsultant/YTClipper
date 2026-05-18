import { NextResponse } from 'next/server';
import { getVideoMetadata } from '@/lib/services/youtubeService';
import { checkAllowedProcessing } from '@/lib/services/complianceService';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const allowed = await checkAllowedProcessing(url);
    if (!allowed.allowed) {
      return NextResponse.json({ error: allowed.reason }, { status: 403 });
    }

    const metadata = await getVideoMetadata(url);
    if (!metadata) {
      return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 404 });
    }

    return NextResponse.json(metadata);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
