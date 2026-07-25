/**
 * Cloudflare Worker Proxy Service
 */

const CLOUDFLARE_WORKER_URL = process.env.CLOUDFLARE_WORKER_URL || 'https://youtube-proxy-worker.hadi-butt04.workers.dev';

interface ProxyResponse {
    success: boolean;
    url?: string;
    error?: string;
}

export async function getDownloadUrlViaCloudflare(
    youtubeUrl: string,
    itag: number
): Promise<ProxyResponse> {
    try {
        const cloudflareUrl = new URL(CLOUDFLARE_WORKER_URL);
        cloudflareUrl.searchParams.append('youtube_url', youtubeUrl);
        cloudflareUrl.searchParams.append('format', String(itag));

        console.log(`[Cloudflare] Requesting: ${youtubeUrl} format: ${itag}`);

        const response = await fetch(cloudflareUrl.toString(), {
            method: 'GET',
            timeout: 15000,
        });

        if (!response.ok) {
            return { success: false, error: `HTTP ${response.status}` };
        }

        const data = await response.json() as any;

        if (data.download_url) {
            console.log(`[Cloudflare] Got URL for itag ${itag}`);
            return { success: true, url: data.download_url };
        }

        return { success: false, error: 'No URL in response' };
    } catch (error: any) {
        console.error(`[Cloudflare] Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}
