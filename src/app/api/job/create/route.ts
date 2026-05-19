import { NextResponse } from 'next/server';
import { createJob } from '@/lib/services/jobService';
import { processMediaJob, getMediaDownloadUrl } from '@/lib/services/mediaService';
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

    // Call getMediaDownloadUrl to resolve formats and filenames
    const result = await getMediaDownloadUrl(url, itag);

    if (result.requiresJob && result.videoItag && result.audioItag) {
      // Create a job to track processing
      const job = createJob();
      
      // Kick off processing in the background without awaiting it
      processMediaJob(job.id, url, result.videoItag, result.audioItag, result.filename);
      
      return NextResponse.json({
        jobId: job.id,
        filename: result.filename,
        requiresJob: true
      });
    }

    // Direct download (audio only or pre-merged SD formats)
    return NextResponse.json({
      downloadUrl: result.downloadUrl,
      filename: result.filename,
      requiresJob: false
    });
  } catch (error: any) {
    console.error('Job creation error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
