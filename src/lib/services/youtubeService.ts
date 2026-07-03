import { ytdl, getYtdlOptions } from './ytdlAgent';
import { getVideoInfoDirect } from './directInnerTube';
import { parseYouTubeUrl } from './youtubeUrlParser';
import { getVideoInfoViaYtdlp } from './ytdlpService';
import { ProxyAgent } from 'undici';

const proxyUrl = process.env.YOUTUBE_PROXY;
const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;

export interface FormatOption {
  itag: number;
  label: string;
  type: 'video' | 'audio';
  quality: string;
  fileSize?: string;
}

export interface VideoMetadata {
  id: string;
  title: string;
  channelTitle: string;
  channelUrl?: string;
  description?: string;
  thumbnailUrl: string;
  duration: string; // e.g., "10:35"
  type: 'video' | 'shorts';
  availableFormats: FormatOption[];
}

export { parseYouTubeUrl, validateYouTubeUrl } from './youtubeUrlParser';

export interface MetadataResult {
  success: boolean;
  metadata: VideoMetadata | null;
  errors: string[];
}

/**
 * Fetches video metadata.
 * Attempt 1: yt-dlp (android_vr client — reliable for all videos)
 * Attempt 2: ytdl-core-enhanced (node.js library, fallback)
 */
export async function getVideoMetadata(url: string): Promise<MetadataResult> {
  const parsed = parseYouTubeUrl(url);
  if (!parsed) {
    return { success: false, metadata: null, errors: ['Invalid YouTube URL format'] };
  }

  const errors: string[] = [];

  // ── Attempt 1: yt-dlp via python3 subprocess ──
  try {
    const ytdlpData = await getVideoInfoViaYtdlp(url);
    if (ytdlpData && ytdlpData.formats?.length > 0) {
      console.log(`[META] yt-dlp returned ${ytdlpData.formats.length} formats`);
      const meta = buildMetadataFromYtdlp(parsed, ytdlpData);
      if (meta.availableFormats.length > 0) {
        return { success: true, metadata: meta, errors };
      } else {
        errors.push('yt-dlp returned data but no available formats matched requirements (MP4 / Audio formats).');
      }
    } else {
      errors.push('yt-dlp failed to return formats (returned null or empty formats list).');
    }
  } catch (e: any) {
    console.warn('[META] yt-dlp failed:', e.message || e);
    errors.push(`yt-dlp subprocess/parsing exception: ${e.message || e}`);
  }

  // ── Attempt 2: Direct InnerTube client ──
  try {
    const directResult = await getVideoInfoDirect(parsed.id);
    if (directResult && directResult.success && directResult.formats.length > 1) {
      console.log(`[META] Direct InnerTube succeeded: ${directResult.formats.length} formats`);
      return {
        success: true,
        metadata: buildMetadata(parsed, directResult.videoDetails, directResult.formats),
        errors
      };
    } else {
      const reason = directResult ? `status success=${directResult.success}, formats=${directResult.formats?.length ?? 0}` : 'returned null';
      errors.push(`Direct InnerTube client failed: ${reason}`);
    }
  } catch (e: any) {
    console.warn('[META] Direct InnerTube failed:', e.message || e);
    errors.push(`Direct InnerTube exception: ${e.message || e}`);
  }

  // ── Attempt 3: ytdl-core-enhanced ──
  try {
    const options = getYtdlOptions();
    const info = await ytdl.getInfo(url, options);
    console.log(`[META] ytdl-core-enhanced returned ${info.formats?.length ?? 0} formats`);
    return {
      success: true,
      metadata: buildMetadata(parsed, info.videoDetails, info.formats),
      errors
    };
  } catch (error: any) {
    console.error('[META] ytdl-core-enhanced failed:', error.message || error);
    errors.push(`ytdl-core-enhanced failed: ${error.message || error}`);
  }

  // ── Attempt 3.5: Google YouTube Data API v3 ──
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (apiKey) {
    try {
      console.log(`[META] Attempting Google YouTube Data API fallback for ${parsed.id}...`);
      const fetchOpts: any = {};
      if (dispatcher) fetchOpts.dispatcher = dispatcher;
      
      const apiRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${parsed.id}&key=${apiKey}`,
        fetchOpts
      );
      if (apiRes.ok) {
        const apiData = await apiRes.json();
        const item = apiData.items?.[0];
        if (item) {
          const snippet = item.snippet;
          const contentDetails = item.contentDetails;
          
          let duration = '??:??';
          const pt = contentDetails?.duration;
          if (pt) {
            const match = pt.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            if (match) {
              const h = parseInt(match[1] || '0', 10);
              const m = parseInt(match[2] || '0', 10);
              const s = parseInt(match[3] || '0', 10);
              if (h > 0) {
                duration = `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
              } else {
                duration = `${m}:${s.toString().padStart(2, '0')}`;
              }
            }
          }
          
          console.log(`[META] Google API fallback succeeded for ${parsed.id}`);
          return {
            success: true,
            metadata: {
              id: parsed.id,
              title: snippet.title || 'Unknown Title',
              channelTitle: snippet.channelTitle || 'Unknown Channel',
              thumbnailUrl: snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || `https://i.ytimg.com/vi/${parsed.id}/hqdefault.jpg`,
              duration,
              type: parsed.type,
              availableFormats: [
                { itag: 18, label: 'MP4 - (360p SD)', type: 'video', quality: '360p' },
                { itag: 22, label: 'MP4 - (720p HD)', type: 'video', quality: '720p' },
                { itag: 140, label: 'Audio - (128kbps m4a)', type: 'audio', quality: '128kbps' },
                { itag: 9000, label: 'MP3 - (128kbps)', type: 'audio', quality: 'mp3' },
              ],
            },
            errors,
          };
        } else {
          errors.push('Google API fallback returned empty items list.');
        }
      } else {
        errors.push(`Google API fallback failed: HTTP ${apiRes.status}`);
      }
    } catch (e: any) {
      console.warn('[META] Google API fallback failed:', e.message || e);
      errors.push(`Google API exception: ${e.message || e}`);
    }
  }

  // ── Attempt 4: NoEmbed (Reliable proxy for metadata) + Lemnos (for duration) ──
  try {
    const fetchOpts: any = {};
    if (dispatcher) fetchOpts.dispatcher = dispatcher;
    
    const noembedRes = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`, fetchOpts);
    if (noembedRes.ok) {
      const noembedData = await noembedRes.json();
      if (!noembedData.error) {
        let duration = '??:??';
        
        // Fetch exact duration via Lemnos public API
        try {
          const lemRes = await fetch(`https://yt.lemnoslife.com/noKey/videos?part=contentDetails&id=${parsed.id}`, fetchOpts);
          if (lemRes.ok) {
            const lemData = await lemRes.json();
            const pt = lemData.items?.[0]?.contentDetails?.duration;
            if (pt) {
              // Parse ISO 8601 duration (PT#H#M#S)
              const match = pt.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
              if (match) {
                const h = parseInt(match[1] || '0', 10);
                const m = parseInt(match[2] || '0', 10);
                const s = parseInt(match[3] || '0', 10);
                if (h > 0) {
                  duration = `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                } else {
                  duration = `${m}:${s.toString().padStart(2, '0')}`;
                }
              }
            }
          }
        } catch(e) {
          console.warn('[META] Failed to fetch duration from Lemnos:', e);
        }

        console.log(`[META] NoEmbed fallback succeeded for ${parsed.id}`);
        return {
          success: true,
          metadata: {
            id: parsed.id,
            title: noembedData.title || 'Unknown Title',
            channelTitle: noembedData.author_name || 'Unknown Channel',
            thumbnailUrl: noembedData.thumbnail_url || `https://i.ytimg.com/vi/${parsed.id}/hqdefault.jpg`,
            duration,
            type: parsed.type,
            availableFormats: [
              { itag: 18, label: 'MP4 - (360p SD)', type: 'video', quality: '360p' },
              { itag: 22, label: 'MP4 - (720p HD)', type: 'video', quality: '720p' },
              { itag: 140, label: 'Audio - (128kbps m4a)', type: 'audio', quality: '128kbps' },
              { itag: 9000, label: 'MP3 - (128kbps)', type: 'audio', quality: 'mp3' },
            ],
          },
          errors,
        };
      } else {
        errors.push(`NoEmbed fallback returned error: ${noembedData.error}`);
      }
    } else {
      errors.push(`NoEmbed fallback failed: HTTP ${noembedRes.status}`);
    }
  } catch (error: any) {
    console.error('[META] NoEmbed fallback failed:', error.message || error);
    errors.push(`NoEmbed fallback failed: ${error.message || error}`);
  }

  console.error('[META] All metadata sources failed');
  return { success: false, metadata: null, errors };
}

// ── Helpers ─────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return (bytes / 1024).toFixed(1) + ' KB';
}

function buildMetadataFromYtdlp(
  parsed: { id: string; type: 'video' | 'shorts' },
  data: any,
): VideoMetadata {
  const totalSeconds = Math.floor(data.duration || 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const duration = hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const MAX_VIDEO_HEIGHT = 1080;
  const availableFormats: FormatOption[] = [];

  const formats: any[] = data.formats || [];

  // De-duplicate video formats by height — prefer mp4, then highest bitrate
  const videoMap = new Map<number, any>();
  for (const f of formats) {
    const height: number = f.height;
    const isVideo = f.vcodec && f.vcodec !== 'none';
    if (!isVideo || !height || height > MAX_VIDEO_HEIGHT) continue;
    const existing = videoMap.get(height);
    const preferNew = !existing
      || (f.ext === 'mp4' && existing.ext !== 'mp4')
      || (f.ext === existing.ext && (f.vbr || f.tbr || 0) > (existing.vbr || existing.tbr || 0));
    if (preferNew) videoMap.set(height, f);
  }

  Array.from(videoMap.values())
    .sort((a, b) => (b.height || 0) - (a.height || 0))
    .forEach(f => {
      const itag = parseInt(f.format_id, 10);
      if (!itag || isNaN(itag)) return;
      let qualityName = 'SD';
      if (f.height >= 1080) qualityName = 'FHD';
      else if (f.height >= 720) qualityName = 'HD';
      const bytes = f.filesize || f.filesize_approx;
      const sizeLabel = bytes ? ` — ${formatBytes(bytes)}` : '';
      availableFormats.push({
        itag,
        label: `MP4 - (${f.height}p ${qualityName})${sizeLabel}`,
        type: 'video',
        quality: `${f.height}p`,
        ...(bytes ? { fileSize: formatBytes(bytes) } : {}),
      });
    });

  // Audio-only formats — deduplicate by bitrate bucket, prefer m4a
  const audioMap = new Map<number, any>();
  for (const f of formats) {
    const isAudioOnly = f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none');
    if (!isAudioOnly || !f.abr) continue;
    const bucket = Math.round((f.abr as number) / 10) * 10;
    const existing = audioMap.get(bucket);
    if (!existing || (f.ext === 'm4a' && existing.ext !== 'm4a')) {
      audioMap.set(bucket, f);
    }
  }

  Array.from(audioMap.values())
    .sort((a, b) => (b.abr || 0) - (a.abr || 0))
    .forEach(f => {
      const itag = parseInt(f.format_id, 10);
      if (!itag || isNaN(itag)) return;
      const kbps = Math.round(f.abr as number);
      const bytes = f.filesize || f.filesize_approx;
      const sizeLabel = bytes ? ` — ${formatBytes(bytes)}` : '';
      availableFormats.push({
        itag,
        label: `Audio - ${kbps}kbps (${f.ext || 'webm'})${sizeLabel}`,
        type: 'audio',
        quality: `${kbps}kbps`,
        ...(bytes ? { fileSize: formatBytes(bytes) } : {}),
      });
    });

  // MP3 option — reuses best audio itag but converted via ffmpeg on download
  const bestAudio = Array.from(audioMap.values()).sort((a, b) => (b.abr || 0) - (a.abr || 0))[0];
  if (bestAudio) {
    availableFormats.push({
      itag: 9000,
      label: 'MP3 - (128kbps)',
      type: 'audio',
      quality: 'mp3',
    });
  }

  console.log(`[META] yt-dlp availableFormats: ${availableFormats.length}`, availableFormats.map(f => f.label));

  return {
    id: data.id || parsed.id,
    title: data.title || '',
    channelTitle: data.uploader || data.channel || 'Unknown',
    channelUrl: data.channel_url || undefined,
    description: data.description ? data.description.slice(0, 150) + (data.description.length > 150 ? '...' : '') : undefined,
    thumbnailUrl: data.thumbnail || '',
    duration,
    type: parsed.type,
    availableFormats,
  };
}

function buildMetadata(
  parsed: { id: string; type: 'video' | 'shorts' },
  videoDetails: any,
  formats: any[],
): VideoMetadata {
  // Format duration
  const totalSeconds = parseInt(videoDetails.lengthSeconds, 10) || 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  let duration = '';
  if (hours > 0) {
    duration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Best thumbnail
  const thumbnails = videoDetails.thumbnails || videoDetails.thumbnail?.thumbnails || [];
  const bestThumbnail = thumbnails.length > 0 ? thumbnails[thumbnails.length - 1].url : '';

  // Build format options
  const availableFormats: FormatOption[] = [];

  // De-duplicate video formats by height
  const videoFormatsMap = new Map<number, any>();
  for (const f of formats) {
    if (f.hasVideo && f.height) {
      const existing = videoFormatsMap.get(f.height);
      if (!existing || (f.hasAudio && !existing.hasAudio)) {
        videoFormatsMap.set(f.height, f);
      }
    }
  }

  const MAX_VIDEO_HEIGHT = 1080;

  const sortedVideoFormats = Array.from(videoFormatsMap.values())
    .sort((a: any, b: any) => (b.height || 0) - (a.height || 0));

  for (const f of sortedVideoFormats) {
    if (f.itag && f.height && f.height <= MAX_VIDEO_HEIGHT) {
      let qualityName = 'SD';
      if (f.height >= 1080) qualityName = 'FHD';
      else if (f.height >= 720) qualityName = 'HD';

      availableFormats.push({
        itag: f.itag,
        label: `MP4 - (${f.height}p ${qualityName})`,
        type: 'video',
        quality: `${f.height}p`,
      });
    }
  }

  // Audio-only formats
  const audioFormats = formats
    .filter((f: any) => !f.hasVideo && f.hasAudio)
    .sort((a: any, b: any) => (b.audioBitrate || 0) - (a.audioBitrate || 0));

  for (const f of audioFormats) {
    if (f.itag && f.audioBitrate) {
      availableFormats.push({
        itag: f.itag,
        label: `Audio - ${f.audioBitrate}kbps (${f.container || 'webm'})`,
        type: 'audio',
        quality: `${f.audioBitrate}kbps`,
      });
    }
  }

  console.log(`[META] Final availableFormats: ${availableFormats.length}`, availableFormats.map(f => f.label));

  return {
    id: videoDetails.videoId,
    title: videoDetails.title,
    channelTitle: videoDetails.author?.name || videoDetails.author || 'Unknown',
    channelUrl: videoDetails.author?.channel_url || videoDetails.channelId ? `https://www.youtube.com/channel/${videoDetails.channelId}` : undefined,
    description: videoDetails.shortDescription
      ? videoDetails.shortDescription.slice(0, 150) + (videoDetails.shortDescription.length > 150 ? '...' : '')
      : videoDetails.description
        ? videoDetails.description.slice(0, 150) + (videoDetails.description.length > 150 ? '...' : '')
        : undefined,
    thumbnailUrl: bestThumbnail,
    duration,
    type: parsed.type,
    availableFormats,
  };
}
