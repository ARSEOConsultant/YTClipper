import { NextResponse } from 'next/server';
import { getTranscript } from '@/lib/services/transcriptService';
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

    const transcript = await getTranscript(url);
    if (!transcript.isAvailable) {
      return NextResponse.json({ error: 'Transcript not available for this video' }, { status: 404 });
    }
    
    return NextResponse.json(transcript);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
