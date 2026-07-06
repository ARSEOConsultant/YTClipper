import { spawn } from 'child_process';
import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

const COOKIE_FILE = path.join(tmpdir(), 'ytclipper-yt-cookies.txt');
let cookieFileWritten = false;

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const metadataCache = new Map<string, { data: YtdlpInfo; expiresAt: number }>();

function getCached(videoId: string): YtdlpInfo | null {
  const entry = metadataCache.get(videoId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    metadataCache.delete(videoId);
    return null;
  }
  return entry.data;
}

function setCache(videoId: string, data: YtdlpInfo): void {
  metadataCache.set(videoId, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

function writeCookieFile(): string {
  if (cookieFileWritten) return COOKIE_FILE;

  const cookiesStr = process.env.YOUTUBE_COOKIES;
  if (!cookiesStr) {
    console.log('[yt-dlp] YOUTUBE_COOKIES env var is not defined');
    return '';
  }

  let clean = cookiesStr.trim();
  if (clean.startsWith("'") && clean.endsWith("'")) clean = clean.slice(1, -1).trim();
  if (clean.startsWith('"') && clean.endsWith('"')) clean = clean.slice(1, -1).trim();

  try {
    const cookies = JSON.parse(clean);
    if (!Array.isArray(cookies)) {
      console.error('[yt-dlp] Parsed cookies is not an array.');
      return '';
    }

    let content = '# Netscape HTTP Cookie File\n';
    for (const c of cookies) {
      const domain = c.domain || '.youtube.com';
      const flag = domain.startsWith('.') ? 'TRUE' : 'FALSE';
      const cookiePath = c.path || '/';
      const secure = c.secure ? 'TRUE' : 'FALSE';
      const exp = Math.floor(c.expirationDate || 0);
      content += [domain, flag, cookiePath, secure, exp, c.name, c.value].join('\t') + '\n';
    }

    writeFileSync(COOKIE_FILE, content);
    cookieFileWritten = true;
    console.log(`[yt-dlp] Successfully wrote cookie file to ${COOKIE_FILE} with ${cookies.length} cookies.`);
    return COOKIE_FILE;
  } catch (e: any) {
    console.error('[yt-dlp] Error writing/parsing cookie file:', e.message || e, e.stack);
    return '';
  }
}

export function generateSessionId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getStickyProxyUrl(sessionId: string): string | undefined {
  const proxyUrl = process.env.YOUTUBE_PROXY;
  if (!proxyUrl) return undefined;

  if (proxyUrl.includes('iproyal.com')) {
    try {
      const url = new URL(proxyUrl);
      // Only append sticky session parameters if using the default rotating port (12321).
      // If the user has configured a custom sticky port (e.g. 10001-14999), do not modify the password.
      if (url.port === '12321' && !url.password.includes('_session-')) {
        url.password = `${url.password}_session-${sessionId}_lifetime-10m`;
      }
      const result = url.toString();
      // Remove trailing slash to prevent python/yt-dlp parsing failures
      return result.endsWith('/') ? result.slice(0, -1) : result;
    } catch (e) {
      console.error('[proxy] Error constructing sticky proxy URL:', e);
      return proxyUrl;
    }
  }

  return proxyUrl;
}

export interface YtdlpFormat {
  format_id: string;
  ext: string;
  height?: number;
  width?: number;
  fps?: number;
  vcodec?: string;
  acodec?: string;
  abr?: number;
  vbr?: number;
  tbr?: number;
  url?: string;
  quality?: number;
  filesize?: number;
  filesize_approx?: number;
  http_headers?: Record<string, string>;
}

export interface YtdlpInfo {
  id: string;
  title: string;
  uploader?: string;
  channel_url?: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  formats: YtdlpFormat[];
  http_headers?: Record<string, string>;
  proxySessionId?: string;
}

export interface YtdlpDownloadFormat {
  itag: number;
  url: string;
  hasVideo: boolean;
  hasAudio: boolean;
  height?: number;
  container: string;
  audioBitrate?: number;
}

/** Returns all formats with direct URLs for a video — used by the download path. */
export async function getDownloadUrlsViaYtdlp(url: string): Promise<YtdlpDownloadFormat[]> {
  const info = await getVideoInfoViaYtdlp(url);
  if (!info) return [];

  return (info.formats || [])
    .filter((f: YtdlpFormat) => f.url && f.format_id && !isNaN(parseInt(f.format_id, 10)))
    .map((f: YtdlpFormat) => ({
      itag: parseInt(f.format_id, 10),
      url: f.url!,
      hasVideo: !!(f.vcodec && f.vcodec !== 'none'),
      hasAudio: !!(f.acodec && f.acodec !== 'none'),
      height: f.height,
      container: f.ext || 'mp4',
      audioBitrate: f.abr ? Math.round(f.abr) : undefined,
    }));
}

// Run once per process on startup — keeps yt-dlp current without blocking requests
if (typeof window === 'undefined') {
  const spawnEnv = { ...process.env };
  if (process.env.YOUTUBE_PROXY) {
    spawnEnv.HTTP_PROXY = process.env.YOUTUBE_PROXY;
    spawnEnv.HTTPS_PROXY = process.env.YOUTUBE_PROXY;
  }
  const upgradeProc = spawn('python3', ['-m', 'pip', 'install', '--upgrade', '--quiet', 'yt-dlp'], {
    detached: true,
    stdio: 'ignore',
    env: spawnEnv,
  });
  upgradeProc.unref();

  // Clean up orphaned tmp files left by previous crashed sessions
  try {
    const { readdirSync, statSync, unlinkSync } = require('fs');
    const tmpDir = require('path').join(process.cwd(), 'tmp');
    const cutoff = Date.now() - 15 * 60 * 1000;
    if (require('fs').existsSync(tmpDir)) {
      for (const file of readdirSync(tmpDir)) {
        const filePath = require('path').join(tmpDir, file);
        try {
          if (statSync(filePath).mtimeMs < cutoff) unlinkSync(filePath);
        } catch (_) {}
      }
    }
  } catch (_) {}
}

export async function getVideoInfoViaYtdlp(url: string, forceSessionId?: string): Promise<YtdlpInfo | null> {
  // Extract video ID for cache key
  const idMatch = url.match(/(?:v=|youtu\.be\/|shorts\/)([^&?/]+)/);
  const videoId = idMatch?.[1];

  if (videoId) {
    const cached = getCached(videoId);
    if (cached) {
      console.log(`[yt-dlp] cache HIT for ${videoId}`);
      return cached;
    }
  }

  const cookieFile = writeCookieFile();
  const sessionId = forceSessionId || generateSessionId();
  const proxyToUse = getStickyProxyUrl(sessionId);

  const runYtdlp = (useProxy: boolean): Promise<YtdlpInfo | null> => {
    return new Promise((resolve) => {
      const args = [
        '-m', 'yt_dlp',
        '--extractor-args', 'youtube:player_client=android_vr',
        '-j',
        '--no-download',
        '--no-warnings',
        '--quiet',
        '--retries', '10',
        '--fragment-retries', '10',
      ];

      if (cookieFile) args.push('--cookies', cookieFile);
      if (useProxy && proxyToUse) {
        args.push('--proxy', proxyToUse);
      }
      args.push(url);

      console.log(`[yt-dlp] Spawning (proxy=${useProxy}): python3 ${args.join(' ')}`);

      const proc = spawn('python3', args, { timeout: 25000 });
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (d: Buffer) => stdout += d.toString());
      proc.stderr.on('data', (d: Buffer) => stderr += d.toString());

      proc.on('close', (code: number | null) => {
        console.log(`[yt-dlp] process exited with code ${code}`);
        if (code !== 0 || !stdout.trim()) {
          console.error(`[yt-dlp] failed (proxy=${useProxy}) with code ${code}. Stderr: ${stderr.trim()}`);
          resolve(null);
          return;
        }
        try {
          const data = JSON.parse(stdout.trim()) as YtdlpInfo;
          data.proxySessionId = sessionId;
          resolve(data);
        } catch (e: any) {
          console.error('[yt-dlp] JSON parse error on stdout:', e.message, 'Stdout preview:', stdout.slice(0, 200));
          resolve(null);
        }
      });

      proc.on('error', (err: any) => {
        console.error('[yt-dlp] Process spawn error:', err.message || err, err);
        resolve(null);
      });
    });
  };

  // Attempt 1: Try with proxy (if configured)
  let result = await runYtdlp(true);
  
  // Attempt 2: Fallback to no proxy if attempt 1 failed and proxy was used
  if (!result && proxyToUse) {
    console.log('[yt-dlp] Proxy attempt failed. Retrying WITHOUT proxy...');
    result = await runYtdlp(false);
  }

  if (result && videoId) {
    setCache(videoId, result);
  }

  return result;
}
