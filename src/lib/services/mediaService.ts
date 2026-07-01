import { ytdl, getYtdlOptions } from './ytdlAgent';
import { getVideoInfoViaYtdlp } from './ytdlpService';

// @ts-ignore
import ffmpegPath from 'ffmpeg-static';
import { spawn } from 'child_process';


import { updateJob } from './jobService';
import fs from 'fs';
import path from 'path';

/**
 * Gets the direct download URL or dynamic streaming URL for a specific YouTube video format.
 */
export async function getMediaDownloadUrl(url: string, itag: number): Promise<{ downloadUrl: string; filename: string; requiresJob?: boolean; videoItag?: number; audioItag?: number }> {
  // ── Special case: MP3 conversion (virtual itag 9000) ──
  if (itag === 9000) {
    try {
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
    } catch (e: any) {
      console.warn('[MEDIA] Local MP3 download fetch failed, falling through to Cobalt API:', e.message);
    }
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
    console.error('[MEDIA] Both local download sources failed:', error.message);
    
    // ── Attempt 3: Cobalt API Fallback ──
    try {
      console.log('[MEDIA] Attempting Cobalt API fallback...');
      let vQuality = '720';
      if (itag === 18) vQuality = '360';
      if (itag === 137) vQuality = '1080';
      
      const isAudioOnly = itag === 140 || itag === 9000 || itag === 251;
      const aFormat = itag === 9000 ? 'mp3' : 'best';

      const cobaltRes = await fetch('https://api.cobalt.tools/api/json', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          vQuality,
          isAudioOnly,
          aFormat,
          disableMetadata: true
        })
      });

      if (cobaltRes.ok) {
        const cobaltData = await cobaltRes.json();
        if (cobaltData.url) {
          const safeTitle = 'ytclipper_video_fallback';
          let ext = isAudioOnly ? (itag === 9000 ? 'mp3' : 'm4a') : 'mp4';
          const typeLabel = isAudioOnly ? 'audio' : 'video';
          console.log('[MEDIA] Cobalt API fallback succeeded');
          
          return {
            downloadUrl: cobaltData.url,
            filename: `${safeTitle}_${typeLabel}.${ext}`,
            requiresJob: false // Cobalt handles the merging
          };
        }
      }
      console.warn('[MEDIA] Cobalt API fallback failed or returned no URL');
    } catch (cobaltErr: any) {
      console.error('[MEDIA] Cobalt API fallback exception:', cobaltErr.message);
    }

    throw new Error(error.message || 'Failed to extract media. YouTube may be blocking your IP. Consider adding YOUTUBE_COOKIES to your .env.local file.');
  }
}

/**
 * Spawns an FFmpeg process to merge the video and audio streams into a temporary file.
 */
export async function processMediaJob(jobId: string, url: string, videoItag: number, audioItag: number, filename: string): Promise<void> {
  try {
    // ── MP3 conversion path (videoItag === 9000) ──
    if (videoItag === 9000) {
      let audioUrl: string | undefined;
      try {
        const ytdlpInfo = await getVideoInfoViaYtdlp(url);
        const af = (ytdlpInfo?.formats || []).find((f: any) => parseInt(f.format_id, 10) === audioItag && f.url);
        audioUrl = af?.url;
      } catch (_e) { /* fall through */ }

      if (!audioUrl) {
        const options = getYtdlOptions();
        const info = await ytdl.getInfo(url, options);
        audioUrl = info.formats.find((f: any) => f.itag === audioItag)?.url;
      }
      if (!audioUrl) throw new Error('Audio URL not found for MP3 conversion.');

      let activeFfmpegPath = ffmpegPath || '';
      if (!fs.existsSync(activeFfmpegPath)) {
        const local = path.resolve(process.cwd(), 'node_modules/ffmpeg-static/ffmpeg');
        if (fs.existsSync(local)) activeFfmpegPath = local;
      }
      const tmpDir = path.join(process.cwd(), 'tmp');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      const filePath = path.join(tmpDir, `${jobId}_${filename}`);

      const ffmpegProcess = spawn(activeFfmpegPath, [
        '-loglevel', 'error', '-i', audioUrl,
        '-vn', '-ar', '44100', '-ac', '2', '-b:a', '128k',
        '-f', 'mp3', '-y', filePath,
      ]) as any;
      ffmpegProcess.on('close', (code: number | null) => {
        if (code === 0) {
          updateJob(jobId, { status: 'completed', filePath, filename });
          setTimeout(() => { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); }, 15 * 60 * 1000);
        } else {
          updateJob(jobId, { status: 'error', error: `FFmpeg MP3 conversion failed (code ${code})` });
        }
      });
      ffmpegProcess.on('error', (err: Error) => {
        updateJob(jobId, { status: 'error', error: 'Failed to spawn FFmpeg for MP3' });
      });
      return;
    }

    let videoUrl: string | undefined;
    let audioUrl: string | undefined;

    // Try yt-dlp first
    try {
      const ytdlpInfo = await getVideoInfoViaYtdlp(url);
      if (ytdlpInfo) {
        const fmts = (ytdlpInfo.formats || []).filter((f: any) => f.url);
        const vf = fmts.find((f: any) => parseInt(f.format_id, 10) === videoItag);
        const af = fmts.find((f: any) => parseInt(f.format_id, 10) === audioItag);
        if (vf?.url) videoUrl = vf.url;
        if (af?.url) audioUrl = af.url;
      }
    } catch (_e) { /* fall through */ }

    // Fallback to ytdl for any missing URLs
    if (!videoUrl || !audioUrl) {
      const options = getYtdlOptions();
      const info = await ytdl.getInfo(url, options);
      if (!videoUrl) videoUrl = info.formats.find((f: any) => f.itag === videoItag)?.url;
      if (!audioUrl) audioUrl = info.formats.find((f: any) => f.itag === audioItag)?.url;
    }

    if (!videoUrl || !audioUrl) {
      throw new Error('Requested formats or URLs not found.');
    }

    let activeFfmpegPath = ffmpegPath || '';
    const pathExists = activeFfmpegPath ? fs.existsSync(activeFfmpegPath) : false;

    if (!pathExists) {
      const localFallback = path.resolve(process.cwd(), 'node_modules/ffmpeg-static/ffmpeg');
      const fallbackExists = fs.existsSync(localFallback);
      if (fallbackExists) {
        activeFfmpegPath = localFallback;
      } else if (!activeFfmpegPath) {
        throw new Error('ffmpeg-static binary path is not available.');
      }
    }

    // Ensure tmp directory exists
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const filePath = path.join(tmpDir, `${jobId}_${filename}`);

    const ffmpegProcess = spawn(activeFfmpegPath, [
      '-loglevel', 'error',
      '-i', videoUrl,
      '-i', audioUrl,
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-map', '0:v:0',
      '-map', '1:a:0',
      '-f', 'mp4',
      '-movflags', 'faststart',
      '-y',
      filePath
    ]) as any;

    ffmpegProcess.on('close', (code: number | null) => {
      if (code === 0) {
        updateJob(jobId, { status: 'completed', filePath, filename });
        // Auto-delete file after 15 minutes to save disk space
        setTimeout(() => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }, 15 * 60 * 1000);
      } else {
        updateJob(jobId, { status: 'error', error: `FFmpeg exited with code ${code}` });
      }
    });

    ffmpegProcess.on('error', (err: Error) => {
      console.error('Failed to spawn FFmpeg process:', err);
      updateJob(jobId, { status: 'error', error: 'Failed to spawn FFmpeg' });
    });

  } catch (error: any) {
    updateJob(jobId, { status: 'error', error: error.message });
  }
}
