import { NextResponse } from 'next/server';
import { extractMp3Audio } from '@/lib/services/mediaService';
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

    const result = await extractMp3Audio(url);
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
