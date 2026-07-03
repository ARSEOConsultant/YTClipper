import { ytdl, getYtdlOptions } from './ytdlAgent';
import { getVideoInfoViaYtdlp } from './ytdlpService';
import { ProxyAgent, fetch as undiciFetch } from 'undici';

const proxyUrl = process.env.YOUTUBE_PROXY;
const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;
const activeFetch = dispatcher ? undiciFetch : fetch;

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
    
    // ── Attempt 2.5: Cobalt API Fallback ──
    try {
      const cobaltResult = await getMediaUrlViaCobalt(url, itag);
      if (cobaltResult) {
        return cobaltResult;
      }
    } catch (e: any) {
      console.warn('[MEDIA] Cobalt fallback failed:', e.message);
    }

    // ── Attempt 2.8: Piped API Fallback ──
    try {
      const pipedResult = await getMediaUrlViaPiped(url, itag);
      if (pipedResult) {
        return pipedResult;
      }
    } catch (e: any) {
      console.warn('[MEDIA] Piped fallback failed:', e.message);
    }

    // ── Attempt 3: Invidious API Fallback ──
    try {
      console.log('[MEDIA] Attempting Invidious API fallback...');
      
      const instances = [
        'https://vid.puffyan.us',
        'https://invidious.jing.rocks',
        'https://inv.tux.pizza',
        'https://invidious.lunar.icu'
      ];

      const fetchOpts: any = {};
      if (dispatcher) fetchOpts.dispatcher = dispatcher;

      for (const instance of instances) {
        try {
          const invRes = await activeFetch(`${instance}/api/v1/videos/${parseYouTubeId(url)}`, fetchOpts);
          if (invRes.ok) {
            const invData = await invRes.json();
            
            const safeTitle = (invData.title || 'video').replace(/[^a-z0-9]/gi, '_').toLowerCase();
            
            // If MP3, we just need the best audio URL and let the job process it
            if (itag === 9000) {
              const bestAudio = (invData.adaptiveFormats || [])
                .filter((f: any) => f.type && f.type.startsWith('audio/'))
                .sort((a: any, b: any) => (parseInt(b.bitrate || 0)) - (parseInt(a.bitrate || 0)))[0];
                
              if (bestAudio && bestAudio.url) {
                return {
                  downloadUrl: '',
                  filename: `ytclipper_${safeTitle}.mp3`,
                  requiresJob: true,
                  videoItag: 9000,
                  audioItag: parseInt(bestAudio.itag, 10),
                };
              }
            }

            // For specific itag, find in formatStreams or adaptiveFormats
            let formatMatch = (invData.formatStreams || []).find((f: any) => parseInt(f.itag) === itag);
            if (!formatMatch) {
              formatMatch = (invData.adaptiveFormats || []).find((f: any) => parseInt(f.itag) === itag);
            }

            if (formatMatch && formatMatch.url) {
              console.log(`[MEDIA] Invidious fallback succeeded via ${instance}`);
              const isAudioOnly = formatMatch.type && formatMatch.type.startsWith('audio/');
              const ext = isAudioOnly ? 'm4a' : 'mp4';
              return {
                downloadUrl: formatMatch.url,
                filename: `ytclipper_${safeTitle}_${isAudioOnly ? 'audio' : 'video'}.${ext}`,
                requiresJob: false
              };
            }
          }
        } catch (e: any) {
          console.warn(`[MEDIA] Invidious instance ${instance} failed:`, e.message);
        }
      }
    } catch (invErr: any) {
      console.error('[MEDIA] Invidious API fallback exception:', invErr.message);
    }

    throw new Error(error.message || 'Failed to extract media. YouTube may be blocking your IP. Consider adding YOUTUBE_COOKIES to your .env.local file.');
  }
}

async function getMediaUrlViaCobalt(url: string, itag: number): Promise<{ downloadUrl: string; filename: string; requiresJob: boolean } | null> {
  const cobaltInstances = [
    'https://api.cobalt.tools/api/json',
    'https://cobalt.api.ryzetech.live/api/json',
    'https://api.cobalt.lol/api/json'
  ];

  let vQuality = '720';
  if (itag === 18) vQuality = '360';
  if (itag === 137 || itag === 136 || itag === 299) vQuality = '1080';

  const isAudioOnly = itag === 140 || itag === 9000 || itag === 251;
  const aFormat = itag === 9000 ? 'mp3' : 'best';

  const fetchOpts: any = {
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
  };
  if (dispatcher) fetchOpts.dispatcher = dispatcher;

  for (const instance of cobaltInstances) {
    try {
      console.log(`[MEDIA] Trying Cobalt fallback via ${instance}...`);
      const response = await activeFetch(instance, fetchOpts);
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          const safeTitle = 'ytclipper_video_fallback';
          const ext = isAudioOnly ? (itag === 9000 ? 'mp3' : 'm4a') : 'mp4';
          const typeLabel = isAudioOnly ? 'audio' : 'video';
          console.log(`[MEDIA] Cobalt fallback succeeded via ${instance}`);
          return {
            downloadUrl: data.url,
            filename: `${safeTitle}_${typeLabel}.${ext}`,
            requiresJob: false
          };
        }
      }
    } catch (e: any) {
      console.warn(`[MEDIA] Cobalt instance ${instance} failed:`, e.message);
    }
  }
  return null;
}

function parseYouTubeId(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) return parsed.pathname.slice(1);
    if (parsed.pathname.startsWith('/shorts/')) return parsed.pathname.split('/')[2];
    return parsed.searchParams.get('v') || '';
  } catch (e) {
    return '';
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
      
      if (!audioUrl) {
        try {
          const invUrls = await getUrlsViaInvidious(url, 9000, audioItag);
          audioUrl = invUrls?.audioUrl;
        } catch (_e) {}
      }
      if (!audioUrl) {
        try {
          const pipedUrls = await getUrlsViaPiped(url, 9000, audioItag);
          audioUrl = pipedUrls?.audioUrl;
        } catch (_e) {}
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
      if (!audioUrl) audioUrl = info.formats.find((f: any) => f.itag === audioItag)?.url;
    }

    if (!videoUrl || !audioUrl) {
      try {
        const invUrls = await getUrlsViaInvidious(url, videoItag, audioItag);
        if (!videoUrl) videoUrl = invUrls?.videoUrl;
        if (!audioUrl) audioUrl = invUrls?.audioUrl;
      } catch (_e) {}
    }
    if (!videoUrl || !audioUrl) {
      try {
        const pipedUrls = await getUrlsViaPiped(url, videoItag, audioItag);
        if (!videoUrl) videoUrl = pipedUrls?.videoUrl;
        if (!audioUrl) audioUrl = pipedUrls?.audioUrl;
      } catch (_e) {}
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

async function getMediaUrlViaPiped(url: string, itag: number): Promise<{ downloadUrl: string; filename: string; requiresJob: boolean; videoItag?: number; audioItag?: number } | null> {
  const pipedInstances = [
    'https://pipedapi.kavin.rocks',
    'https://piped-api.garudalinux.org',
    'https://pipedapi.lunes.host',
    'https://api.piped.yt'
  ];

  const videoId = parseYouTubeId(url);
  if (!videoId) return null;

  const fetchOpts: any = {};
  if (dispatcher) fetchOpts.dispatcher = dispatcher;

  for (const instance of pipedInstances) {
    try {
      console.log(`[MEDIA] Trying Piped fallback via ${instance}...`);
      const response = await activeFetch(`${instance}/streams/${videoId}`, fetchOpts);
      if (response.ok) {
        const data = await response.json();
        const safeTitle = (data.title || 'video').replace(/[^a-z0-9]/gi, '_').toLowerCase();

        // Special case: MP3
        if (itag === 9000) {
          const audioStreams = data.audioStreams || [];
          const bestAudio = audioStreams.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0];
          if (bestAudio && bestAudio.url) {
            return {
              downloadUrl: '',
              filename: `ytclipper_${safeTitle}.mp3`,
              requiresJob: true,
              videoItag: 9000,
              audioItag: bestAudio.itag || 140
            };
          }
        }

        // Search in videoStreams (video or combined)
        let matchedStream = (data.videoStreams || []).find((s: any) => s.itag === itag);
        
        // Search in audioStreams
        if (!matchedStream) {
          matchedStream = (data.audioStreams || []).find((s: any) => s.itag === itag);
        }

        if (matchedStream && matchedStream.url) {
          console.log(`[MEDIA] Piped fallback succeeded via ${instance}`);
          const isAudioOnly = matchedStream.videoOnly === false && !matchedStream.height;
          
          if (matchedStream.videoOnly) {
            // Video only stream: needs audio merging!
            const audioStreams = data.audioStreams || [];
            const bestAudio = audioStreams.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0];
            if (bestAudio && bestAudio.itag) {
              return {
                downloadUrl: '',
                filename: `ytclipper_${safeTitle}_${matchedStream.height || itag}p.mp4`,
                requiresJob: true,
                videoItag: itag,
                audioItag: bestAudio.itag
              };
            }
          }

          const ext = isAudioOnly ? 'm4a' : 'mp4';
          return {
            downloadUrl: matchedStream.url,
            filename: `ytclipper_${safeTitle}_${isAudioOnly ? 'audio' : 'video'}.${ext}`,
            requiresJob: false
          };
        }
      }
    } catch (e: any) {
      console.warn(`[MEDIA] Piped instance ${instance} failed:`, e.message);
    }
  }
  return null;
}

async function getUrlsViaInvidious(url: string, videoItag: number, audioItag: number): Promise<{ videoUrl?: string; audioUrl?: string } | null> {
  const instances = [
    'https://vid.puffyan.us',
    'https://invidious.jing.rocks',
    'https://inv.tux.pizza',
    'https://invidious.lunar.icu'
  ];
  const videoId = parseYouTubeId(url);
  if (!videoId) return null;

  const fetchOpts: any = {};
  if (dispatcher) fetchOpts.dispatcher = dispatcher;

  for (const instance of instances) {
    try {
      const res = await activeFetch(`${instance}/api/v1/videos/${videoId}`, fetchOpts);
      if (res.ok) {
        const data = await res.json();
        let videoUrl: string | undefined;
        let audioUrl: string | undefined;

        const formats = [...(data.formatStreams || []), ...(data.adaptiveFormats || [])];

        if (videoItag !== 9000) {
          const vf = formats.find((f: any) => parseInt(f.itag, 10) === videoItag);
          if (vf?.url) videoUrl = vf.url;
        }

        const af = formats.find((f: any) => parseInt(f.itag, 10) === audioItag);
        if (af?.url) audioUrl = af.url;

        if (audioUrl && (videoItag === 9000 || videoUrl)) {
          return { videoUrl, audioUrl };
        }
      }
    } catch (_e) {}
  }
  return null;
}

async function getUrlsViaPiped(url: string, videoItag: number, audioItag: number): Promise<{ videoUrl?: string; audioUrl?: string } | null> {
  const pipedInstances = [
    'https://pipedapi.kavin.rocks',
    'https://piped-api.garudalinux.org',
    'https://pipedapi.lunes.host',
    'https://api.piped.yt'
  ];
  const videoId = parseYouTubeId(url);
  if (!videoId) return null;

  const fetchOpts: any = {};
  if (dispatcher) fetchOpts.dispatcher = dispatcher;

  for (const instance of pipedInstances) {
    try {
      const res = await activeFetch(`${instance}/streams/${videoId}`, fetchOpts);
      if (res.ok) {
        const data = await res.json();
        let videoUrl: string | undefined;
        let audioUrl: string | undefined;

        const formats = [...(data.videoStreams || []), ...(data.audioStreams || [])];

        if (videoItag !== 9000) {
          const vf = formats.find((f: any) => f.itag === videoItag);
          if (vf?.url) videoUrl = vf.url;
        }

        const af = formats.find((f: any) => f.itag === audioItag);
        if (af?.url) audioUrl = af.url;

        if (audioUrl && (videoItag === 9000 || videoUrl)) {
          return { videoUrl, audioUrl };
        }
      }
    } catch (_e) {}
  }
  return null;
}
