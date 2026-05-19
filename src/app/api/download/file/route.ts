import { NextResponse } from 'next/server';
import { getJob } from '@/lib/services/jobService';
import fs from 'fs';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    const job = getJob(jobId);

    if (!job || job.status !== 'completed' || !job.filePath) {
      return NextResponse.json({ error: 'Job not found or not completed' }, { status: 404 });
    }

    if (!fs.existsSync(job.filePath)) {
      return NextResponse.json({ error: 'File no longer exists on the server' }, { status: 410 });
    }

    const stat = fs.statSync(job.filePath);
    const fileStream = fs.createReadStream(job.filePath);
    
    // Convert Node ReadStream to Web ReadableStream
    const stream = Readable.toWeb(fileStream) as ReadableStream;

    return new Response(stream, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': stat.size.toString(),
        'Content-Disposition': `attachment; filename="${job.filename || 'download.mp4'}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('File download error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
