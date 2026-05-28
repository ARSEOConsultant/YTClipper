import { spawn } from 'child_process';
import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

const COOKIE_FILE = path.join(tmpdir(), 'ytclipper-yt-cookies.txt');
let cookieFileWritten = false;

function writeCookieFile(): string {
  if (cookieFileWritten) return COOKIE_FILE;

  const cookiesStr = process.env.YOUTUBE_COOKIES;
  if (!cookiesStr) return '';

  let clean = cookiesStr.trim();
  if (clean.startsWith("'") && clean.endsWith("'")) clean = clean.slice(1, -1).trim();
  if (clean.startsWith('"') && clean.endsWith('"')) clean = clean.slice(1, -1).trim();

  try {
    const cookies = JSON.parse(clean);
    if (!Array.isArray(cookies)) return '';

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
    return COOKIE_FILE;
  } catch (_e) {
    return '';
  }
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
  url?: string;
  quality?: number;
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

export async function getVideoInfoViaYtdlp(url: string): Promise<YtdlpInfo | null> {
  const cookieFile = writeCookieFile();

  return new Promise((resolve) => {
    const args = [
      '-m', 'yt_dlp',
      '--extractor-args', 'youtube:player_client=android_vr',
      '-j',
      '--no-download',
      '--no-warnings',
      '--quiet',
    ];

    if (cookieFile) args.push('--cookies', cookieFile);
    args.push(url);

    const proc = spawn('python3', args, { timeout: 25000 });
    let stdout = '';

    proc.stdout.on('data', (d: Buffer) => stdout += d.toString());
    proc.on('close', (code: number | null) => {
      if (code !== 0 || !stdout.trim()) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(stdout.trim()));
      } catch (_e) {
        resolve(null);
      }
    });
    proc.on('error', () => resolve(null));
  });
}
