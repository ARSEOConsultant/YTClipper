import { NextResponse } from 'next/server';
import { prepareMp4Download } from '@/lib/services/mediaService';
import { checkAllowedProcessing } from '@/lib/services/complianceService';

export async function POST(request: Request) {
  try {
    const { url, quality = '1080p' } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const allowed = await checkAllowedProcessing(url);
    if (!allowed.allowed) {
      return NextResponse.json({ error: allowed.reason }, { status: 403 });
    }

    const result = await prepareMp4Download(url, quality);
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
