import { ytdl, getYtdlOptions } from './ytdlAgent';
import { getVideoInfoViaYtdlp, getStickyProxyUrl, writeCookieFile, getRawProxyUrl } from './ytdlpService';
import { getDownloadUrlViaCloudflare } from './cloudflareProxyService';

// @ts-ignore
import ffmpegPath from 'ffmpeg-static';
import { spawn } from 'child_process';


import { updateJob } from './jobService';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Gets the direct download URL or dynamic streaming URL for a specific YouTube video format.
 */
export async function getMediaDownloadUrl(url: string, itag: number): Promise<{ downloadUrl: string; filename: string; requiresJob?: boolean; videoItag?: number; audioItag?: number }> {
  // ── Special case: MP3 conversion (virtual itag 9000) ──
  if (itag === 9000) {
    const ytdlpInfo = await getVideoInfoViaYtdlp(url);
    if (!ytdlpInfo) throw new Error('Could not fetch video info for MP3 conversion.');
    const formats = (ytdlpInfo.formats || []).filter((f: any) => f.url);
    const bestAudio = formats
      .filter((f: any) => f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none'))
      .sort((a: any, b: any) => (b.abr || 0) - (a.abr || 0))[0];
    if (!bestAudio) throw new Error('No audio format found for MP3 conversion.');
    const safeTitle = (ytdlpInfo.title || 'audio').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return {
      downloadUrl: '',
      filename: `ytclipper_${safeTitle}.mp3`,
      requiresJob: true,
      videoItag: 9000,
      audioItag: parseInt(bestAudio.format_id, 10),
    };
  }

  // ── Try yt-dlp first (handles all videos reliably) ──
  try {
    const ytdlpInfo = await getVideoInfoViaYtdlp(url);
    if (ytdlpInfo) {
      const formats = (ytdlpInfo.formats || []).filter((f: any) => f.url && !isNaN(parseInt(f.format_id, 10)));
      const format = formats.find((f: any) => parseInt(f.format_id, 10) === itag);

      if (format) {
        const safeTitle = (ytdlpInfo.title || 'video').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const hasVideo = !!(format.vcodec && format.vcodec !== 'none');
        const hasAudio = !!(format.acodec && format.acodec !== 'none');

        if (hasVideo && !hasAudio) {
          // Video-only: find best audio from yt-dlp formats
          const audioFormat = formats
            .filter((f: any) => f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none'))
            .sort((a: any, b: any) => (b.abr || 0) - (a.abr || 0))[0];
          if (!audioFormat) throw new Error('No audio format found.');
          return {
            downloadUrl: '',
            filename: `ytclipper_${safeTitle}_${format.height || itag}p.mp4`,
            requiresJob: true,
            videoItag: itag,
            audioItag: parseInt(audioFormat.format_id, 10),
          };
        }

        const isAudioOnly = !hasVideo && hasAudio;
        const ext = isAudioOnly && format.ext === 'mp4' ? 'm4a' : (format.ext || 'mp4');
        const typeLabel = isAudioOnly ? 'audio' : 'video';
        return {
          downloadUrl: format.url || '',
          filename: `ytclipper_${safeTitle}_${typeLabel}.${ext}`,
        };
      }
    }
  } catch (e: any) {
    console.warn('[MEDIA] yt-dlp download URL failed, trying ytdl:', e.message);
  }

  // ── Fallback: ytdl-core-enhanced ──
  try {
    const options = getYtdlOptions();
    const info = await ytdl.getInfo(url, options);
    const format = info.formats.find((f: any) => f.itag === itag);
    if (!format) throw new Error('Could not find the requested format.');

    const safeTitle = info.videoDetails.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const isVideoOnly = format.hasVideo && !format.hasAudio;

    if (isVideoOnly) {
      const audioFormat = info.formats
        .filter((f: any) => !f.hasVideo && f.hasAudio)
        .sort((a: any, b: any) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0];
      if (!audioFormat) throw new Error('No audio format found.');
      return {
        downloadUrl: '',
        filename: `ytclipper_${safeTitle}_${format.height}p.mp4`,
        requiresJob: true,
        videoItag: itag,
        audioItag: audioFormat.itag,
      };
    }

    const isAudioOnly = !format.hasVideo && format.hasAudio;
    let ext: string = format.container || 'mp4';
    if (isAudioOnly && format.container === 'mp4') ext = 'm4a';
    return {
      downloadUrl: format.url || '',
      filename: `ytclipper_${safeTitle}_${isAudioOnly ? 'audio' : 'video'}.${ext}`,
    };
  } catch (error: any) {
    console.error('[MEDIA] Both download sources failed:', error.message);
    throw new Error(error.message || 'Failed to extract media');
  }
}

function getFfmpegLocation(): string {
  // Check common directories where ffmpeg and ffprobe coexist
  const commonDirs = [
    '/opt/homebrew/bin',
    '/usr/local/bin',
    '/usr/bin',
    path.join(os.homedir(), '.local/bin'),
  ];

  for (const dir of commonDirs) {
    if (fs.existsSync(path.join(dir, 'ffmpeg')) && fs.existsSync(path.join(dir, 'ffprobe'))) {
      console.log(`[MEDIA] Found ffmpeg and ffprobe coexisting in: ${dir}`);
      return dir;
    }
  }

  // Fallback to ffmpeg-static path
  const activeFfmpegPath = ffmpegPath || '';
  if (activeFfmpegPath && fs.existsSync(activeFfmpegPath)) {
    return activeFfmpegPath;
  }
  const local = path.resolve(process.cwd(), 'node_modules/ffmpeg-static/ffmpeg');
  if (fs.existsSync(local)) {
    return local;
  }
  return 'ffmpeg';
}

function getFfmpegInputOptions(httpHeaders?: Record<string, string>): string[] {
  const options: string[] = [];
  if (!httpHeaders) return options;

  let userAgent = '';
  let otherHeadersStr = '';

  for (const [key, val] of Object.entries(httpHeaders)) {
    if (key.toLowerCase() === 'user-agent') {
      userAgent = val;
    } else {
      otherHeadersStr += `${key}: ${val}\r\n`;
    }
  }

  if (userAgent) {
    options.push('-user_agent', userAgent);
  }
  if (otherHeadersStr) {
    options.push('-headers', otherHeadersStr);
  }
  return options;
}

/**
 * Determine if we should use proxy for this download
 * Strategy: Try without proxy first, use proxy only if free attempt fails
 */
function shouldUseProxyForDownload(useCount: number): boolean {
  // First 2 attempts without proxy
  if (useCount < 2) return false;
  // After 2 failures, use proxy
  return true;
}

/**
 * Attempt download via yt-dlp with optional proxy
 */
async function attemptYtdlpDownload(
  url: string,
  videoItag: number,
  audioItag: number,
  filePath: string,
  ffmpegPath: string,
  cookieFile: string,
  useProxy: boolean,
  proxyUrl?: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const args = [
      '-m', 'yt_dlp',
      '--ffmpeg-location', ffmpegPath,
      '--no-warnings',
      '--quiet',
      '--retries', '10',
      '--fragment-retries', '10',
    ];

    if (cookieFile) args.push('--cookies', cookieFile);
    if (useProxy && proxyUrl) args.push('--proxy', proxyUrl);

    args.push(
      '-f', `${videoItag}+${audioItag}`,
      '--merge-output-format', 'mp4',
      '-o', filePath,
      url
    );

    const spawnEnv = { ...process.env };
    const extraPaths = [
      '/opt/homebrew/bin',
      '/usr/local/bin',
      path.join(os.homedir(), '.local/bin'),
    ].filter(fs.existsSync);
    if (extraPaths.length > 0) {
      spawnEnv.PATH = `${extraPaths.join(':')}:${process.env.PATH || ''}`;
    }

    const proc = spawn('python3', args, { env: spawnEnv, timeout: 300000 });
    let stderr = '';

    proc.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on('close', (code: number | null) => {
      if (code === 0) {
        resolve({ success: true });
      } else {
        resolve({
          success: false,
          error: `yt-dlp exited with code ${code}: ${stderr.trim().slice(0, 200)}`
        });
      }
    });

    proc.on('error', (err: Error) => {
      resolve({ success: false, error: err.message });
    });
  });
}

/**
 * Schedule file cleanup after download
 */
function scheduleFileCleanup(filePath: string): void {
  setTimeout(() => {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`[MEDIA] Cleaned up file: ${filePath}`);
      } catch (e) {
        console.error(`[MEDIA] Failed to clean up ${filePath}:`, e);
      }
    }
  }, 15 * 60 * 1000); // 15 minutes
}

/**
 * Spawns an FFmpeg process to merge the video and audio streams into a temporary file.
 */
export async function processMediaJob(jobId: string, url: string, videoItag: number, audioItag: number, filename: string): Promise<void> {
  try {
    const activeFfmpegPath = getFfmpegLocation();
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const filePath = path.join(tmpDir, `${jobId}_${filename}`);

    const cookieFile = writeCookieFile();
    let ytdlpInfo: any = null;
    try {
      ytdlpInfo = await getVideoInfoViaYtdlp(url);
    } catch (_) {}

    const proxySessionId = ytdlpInfo?.proxySessionId;
    const proxyToUse = proxySessionId ? getStickyProxyUrl(proxySessionId) : getRawProxyUrl();

    // ── Cost optimization: Try without proxy first (free attempt) ──
    let useProxy = false;
    const freeAttempt = await attemptYtdlpDownload(
      url, videoItag, audioItag, filePath, activeFfmpegPath, cookieFile, false
    );

    if (freeAttempt.success) {
      console.log(`[MEDIA] Job ${jobId} completed via FREE method (no proxy). Cost savings: ~£0.12`);
      updateJob(jobId, { status: 'completed', filePath, filename });
      scheduleFileCleanup(filePath);
      return;
    }

    // Free attempt failed, fall back to proxy
    console.log(`[MEDIA] Free attempt failed for job ${jobId}. Using proxy fallback...`);
    useProxy = true;

    const args = [
      '-m', 'yt_dlp',
      '--ffmpeg-location', activeFfmpegPath,
      '--no-warnings',
      '--quiet',
      '--retries', '10',
      '--fragment-retries', '10',
    ];

    if (cookieFile) {
      args.push('--cookies', cookieFile);
    }
    if (useProxy && proxyToUse) {
      args.push('--proxy', proxyToUse);
      console.log(`[MEDIA] Job ${jobId} using proxy (fallback). Cost: ~£0.12`);
    }

    if (videoItag === 9000) {
      // MP3 conversion
      args.push(
        '-f', String(audioItag),
        '-x',
        '--audio-format', 'mp3',
        '--audio-quality', '128k',
        '-o', filePath,
        url
      );
    } else {
      // Video + Audio merge
      args.push(
        '-f', `${videoItag}+${audioItag}`,
        '--merge-output-format', 'mp4',
        '-o', filePath,
        url
      );
    }

    const spawnEnv = { ...process.env };
    const extraPaths = [
      '/opt/homebrew/bin',
      '/usr/local/bin',
      path.join(os.homedir(), '.local/bin'),
    ].filter(fs.existsSync);
    if (extraPaths.length > 0) {
      spawnEnv.PATH = `${extraPaths.join(':')}:${process.env.PATH || ''}`;
    }

    console.log(`[MEDIA] Spawning yt-dlp downloader: python3 ${args.join(' ')}`);
    const proc = spawn('python3', args, { env: spawnEnv });

    let stderr = '';
    proc.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on('close', (code: number | null) => {
      if (code === 0) {
        console.log(`[MEDIA] Job ${jobId} completed successfully (proxy fallback).`);
        updateJob(jobId, { status: 'completed', filePath, filename });
        scheduleFileCleanup(filePath);
      } else {
        const errorMsg = `yt-dlp downloader exited with code ${code}. Stderr: ${stderr.trim()}`;
        console.error(`[MEDIA] Job ${jobId} error: ${errorMsg}`);
        updateJob(jobId, { status: 'error', error: errorMsg });
      }
    });

    proc.on('error', (err: Error) => {
      console.error(`[MEDIA] Job ${jobId} spawn error:`, err);
      updateJob(jobId, { status: 'error', error: 'Failed to spawn yt-dlp downloader' });
    });

  } catch (error: any) {
    console.error(`[MEDIA] Job ${jobId} exception:`, error);
    updateJob(jobId, { status: 'error', error: error.message || 'Internal Server Error' });
  }
}
