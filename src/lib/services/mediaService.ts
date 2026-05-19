// @ts-ignore
import ytdl from 'ytdl-core-enhanced';

// @ts-ignore
import ffmpegPath from 'ffmpeg-static';
import { spawn } from 'child_process';
import { Readable } from 'stream';

import { updateJob } from './jobService';
import fs from 'fs';
import path from 'path';

/**
 * Gets the direct download URL or dynamic streaming URL for a specific YouTube video format.
 */
export async function getMediaDownloadUrl(url: string, itag: number): Promise<{ downloadUrl: string; filename: string; requiresJob?: boolean; videoItag?: number; audioItag?: number }> {
  try {
    const info = await ytdl.getInfo(url);
    const format = info.formats.find((f: any) => f.itag === itag);
    
    if (!format) {
      throw new Error('Could not find the requested format.');
    }

    const safeTitle = info.videoDetails.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    // Check if it is a video-only format (needs merging)
    const isVideoOnly = format.hasVideo && !format.hasAudio;

    if (isVideoOnly) {
      // Find the highest bitrate audio format
      const audioFormat = info.formats
        .filter((f: any) => !f.hasVideo && f.hasAudio)
        .sort((a: any, b: any) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0];

      if (!audioFormat) {
        throw new Error('No audio format found to merge with the video.');
      }

      const ext = 'mp4';
      const filename = `ytclipper_${safeTitle}_${format.height}p.${ext}`;
      
      return {
        downloadUrl: '',
        filename,
        requiresJob: true,
        videoItag: itag,
        audioItag: audioFormat.itag
      };
    }

    // Otherwise, direct combined or audio-only download
    const isAudioOnly = !format.hasVideo && format.hasAudio;
    let ext = format.container || 'mp4';
    if (isAudioOnly && format.container === 'mp4') ext = 'm4a';

    const typeLabel = isAudioOnly ? 'audio' : 'video';
    const filename = `ytclipper_${safeTitle}_${typeLabel}.${ext}`;

    return {
      downloadUrl: format.url || '',
      filename
    };
  } catch (error: any) {
    console.error('Error fetching media format:', error);
    throw new Error(error.message || 'Failed to extract media');
  }
}

/**
 * Spawns an FFmpeg process to merge the video and audio streams into a temporary file.
 */
export async function processMediaJob(jobId: string, url: string, videoItag: number, audioItag: number, filename: string): Promise<void> {
  try {
    const info = await ytdl.getInfo(url);
    const videoFormat = info.formats.find((f: any) => f.itag === videoItag);
    const audioFormat = info.formats.find((f: any) => f.itag === audioItag);

    if (!videoFormat || !videoFormat.url || !audioFormat || !audioFormat.url) {
      throw new Error('Requested formats or URLs not found.');
    }

    let activeFfmpegPath = ffmpegPath;
    const pathExists = fs.existsSync(ffmpegPath);

    if (!pathExists) {
      const localFallback = path.resolve(process.cwd(), 'node_modules/ffmpeg-static/ffmpeg');
      const fallbackExists = fs.existsSync(localFallback);
      if (fallbackExists) {
        activeFfmpegPath = localFallback;
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
      '-i', videoFormat.url,
      '-i', audioFormat.url,
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-map', '0:v:0',
      '-map', '1:a:0',
      '-f', 'mp4',
      '-movflags', 'faststart',
      '-y',
      filePath
    ]);

    ffmpegProcess.on('close', (code) => {
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

    ffmpegProcess.on('error', (err) => {
      console.error('Failed to spawn FFmpeg process:', err);
      updateJob(jobId, { status: 'error', error: 'Failed to spawn FFmpeg' });
    });

  } catch (error: any) {
    updateJob(jobId, { status: 'error', error: error.message });
  }
}
