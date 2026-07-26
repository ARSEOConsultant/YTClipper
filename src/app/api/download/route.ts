import { NextRequest, NextResponse } from 'next/server';
import { ProxyAgent, fetch as undiciFetch } from 'undici';
import { getMediaDownloadUrl } from '@/lib/services/mediaService';
import { getStickyProxyUrl } from '@/lib/services/ytdlpService';

/**
 * Download endpoint for streaming YouTube videos.
 *
 * Usage: /api/download?url=https://youtube.com/watch?v=VIDEO_ID&itag=18
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const youtubeUrl = searchParams.get('url');
    const itag = searchParams.get('itag');

    // Validate inputs
    if (!youtubeUrl || !itag) {
      return NextResponse.json(
        { error: 'Missing url or itag parameter' },
        { status: 400 }
      );
    }

    const itagNum = parseInt(itag, 10);
    if (isNaN(itagNum)) {
      return NextResponse.json(
        { error: 'Invalid itag format' },
        { status: 400 }
      );
    }

    console.log(`[DOWNLOAD API] Streaming: ${youtubeUrl} itag: ${itagNum}`);

    // Get download URL and filename
    const { downloadUrl, filename, requiresJob, usedProxy, proxySessionId } = await getMediaDownloadUrl(youtubeUrl, itagNum);

    if (!downloadUrl) {
      return NextResponse.json(
        { error: 'Could not get download URL. Video may require processing.' },
        { status: 400 }
      );
    }

    console.log(`[DOWNLOAD API] Got URL: ${downloadUrl.slice(0, 50)}...`);

    // The resolved googlevideo.com URL is IP-locked to whichever connection
    // fetched it during resolution. If that used the residential proxy, we
    // must fetch the actual bytes through the SAME sticky proxy session —
    // otherwise YouTube's CDN rejects the request with 403 (IP mismatch).
    const proxyUrl = usedProxy && proxySessionId ? getStickyProxyUrl(proxySessionId) : undefined;
    const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;
    const doFetch = dispatcher
      ? (u: string, opts: any) => undiciFetch(u, { ...opts, dispatcher })
      : fetch;

    console.log(`[DOWNLOAD API] Fetching file bytes (proxy=${!!dispatcher})`);

    // Fetch the actual file from YouTube
    const fileResponse = await doFetch(downloadUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!fileResponse.ok) {
      console.error(`[DOWNLOAD API] YouTube returned ${fileResponse.status}`);
      return NextResponse.json(
        { error: `YouTube returned ${fileResponse.status}` },
        { status: fileResponse.status }
      );
    }

    // Get file size if available
    const contentLength = fileResponse.headers.get('content-length');
    const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream';

    // Create response with proper headers for caching
    const response = new NextResponse(fileResponse.body as ReadableStream<Uint8Array> | null, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        // ── Cloudflare caching headers ──
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'CDN-Cache-Control': 'max-age=86400', // Cloudflare specific
        // ── Browser caching ──
        'Expires': new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString(),
      },
    });

    if (contentLength) {
      response.headers.set('Content-Length', contentLength);
    }

    console.log(`[DOWNLOAD API] Streaming ${filename} (${contentLength || 'unknown'} bytes). Cache: 24h`);
    return response;
  } catch (error: any) {
    console.error('[DOWNLOAD API] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to download' },
      { status: 500 }
    );
  }
}
