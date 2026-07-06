import { NextResponse } from 'next/server';
import { Readable } from 'stream';
import miniget from 'miniget';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { getVideoInfoViaYtdlp, getStickyProxyUrl } from '@/lib/services/ytdlpService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');
    const itagStr = searchParams.get('itag');
    const filename = searchParams.get('filename') || 'download.mp4';

    if (!videoId || !itagStr) {
      return NextResponse.json({ error: 'videoId and itag are required' }, { status: 400 });
    }

    const itag = parseInt(itagStr, 10);
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Look up video info (will hit cache instantly if fetched recently)
    const info = await getVideoInfoViaYtdlp(youtubeUrl);
    if (!info) {
      return NextResponse.json({ error: 'Could not fetch video metadata' }, { status: 404 });
    }

    const format = info.formats.find((f: any) => parseInt(f.format_id, 10) === itag);
    if (!format || !format.url) {
      return NextResponse.json({ error: 'Format URL not found' }, { status: 404 });
    }

    const proxySessionId = info.proxySessionId;
    const proxyUrl = proxySessionId ? getStickyProxyUrl(proxySessionId) : process.env.YOUTUBE_PROXY;
    
    const requestHeaders = format.http_headers || info.http_headers || {};

    const options: any = {
      headers: requestHeaders,
    };

    if (proxyUrl) {
      options.agent = new HttpsProxyAgent(proxyUrl);
    }

    console.log(`[stream] Proxying download for videoId=${videoId}, itag=${itag} via proxy session=${proxySessionId || 'none'}`);

    // Create proxy request stream
    const minigetStream = miniget(format.url, options);

    // Convert Node Readable to Web ReadableStream
    const webStream = Readable.toWeb(minigetStream) as ReadableStream;

    const isAudioOnly = !format.vcodec || format.vcodec === 'none';
    const contentType = isAudioOnly 
      ? (format.ext === 'mp3' ? 'audio/mpeg' : 'audio/mp4') 
      : 'video/mp4';

    return new Response(webStream, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error: any) {
    console.error('[stream] Streaming download error:', error);
    return NextResponse.json({ error: 'Streaming download failed' }, { status: 500 });
  }
}
