import { NextResponse } from 'next/server';
import { getJob } from '@/lib/services/jobService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    const job = getJob(jobId);

    if (!job) {
      return NextResponse.json({ error: 'Job not found or expired' }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error: any) {
    console.error('Job status error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
