import { ytdl, getYtdlOptions } from './ytdlAgent';
import { getVideoInfoDirect } from './directInnerTube';
import { parseYouTubeUrl } from './youtubeUrlParser';
import { getVideoInfoViaYtdlp } from './ytdlpService';

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

  // Only offer 360p (itag 18) — a pre-merged progressive format that needs
  // no video+audio merging, no ffmpeg, and no server-side processing.
  // Downloading HD requires combining separate video-only and audio-only
  // streams, which is far more fragile against YouTube's bot detection
  // and drives up proxy costs — not worth it for a global, high-volume tool.
  const MAX_VIDEO_HEIGHT = 360;
  const availableFormats: FormatOption[] = [];

  const formats: any[] = data.formats || [];

  // Pick the single best video format at or below the height cap —
  // prefer mp4, then highest bitrate. Only one video option is exposed.
  // Strongly prefer progressive formats (video+audio already combined,
  // e.g. itag 18) over video-only streams, which would silently require
  // ffmpeg merging — exactly what capping at 360p is meant to avoid.
  let bestProgressive: any = null;
  let bestVideoOnly: any = null;
  for (const f of formats) {
    const height: number = f.height;
    const isVideo = f.vcodec && f.vcodec !== 'none';
    const isAudio = f.acodec && f.acodec !== 'none';
    if (!isVideo || !height || height > MAX_VIDEO_HEIGHT) continue;

    const bucket = isAudio ? 'bestProgressive' : 'bestVideoOnly';
    const existing = bucket === 'bestProgressive' ? bestProgressive : bestVideoOnly;
    const preferNew = !existing
      || height > existing.height
      || (height === existing.height && f.ext === 'mp4' && existing.ext !== 'mp4')
      || (height === existing.height && f.ext === existing.ext && (f.vbr || f.tbr || 0) > (existing.vbr || existing.tbr || 0));
    if (preferNew) {
      if (bucket === 'bestProgressive') bestProgressive = f;
      else bestVideoOnly = f;
    }
  }
  const bestVideoFormat = bestProgressive || bestVideoOnly;

  if (bestVideoFormat) {
    const itag = parseInt(bestVideoFormat.format_id, 10);
    if (itag && !isNaN(itag)) {
      const bytes = bestVideoFormat.filesize || bestVideoFormat.filesize_approx;
      const sizeLabel = bytes ? ` — ${formatBytes(bytes)}` : '';
      availableFormats.push({
        itag,
        label: `MP4 - (${bestVideoFormat.height}p)${sizeLabel}`,
        type: 'video',
        quality: `${bestVideoFormat.height}p`,
        ...(bytes ? { fileSize: formatBytes(bytes) } : {}),
      });
    }
  }

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

  // Only offer 360p — a single progressive (video+audio already combined)
  // format that needs no ffmpeg merging. Same reasoning as buildMetadataFromYtdlp.
  const MAX_VIDEO_HEIGHT = 360;

  let bestVideoFormat: any = null;
  for (const f of formats) {
    if (!f.hasVideo || !f.height || f.height > MAX_VIDEO_HEIGHT) continue;
    const preferNew = !bestVideoFormat
      || (f.hasAudio && !bestVideoFormat.hasAudio)
      || (f.hasAudio === bestVideoFormat.hasAudio && f.height > bestVideoFormat.height);
    if (preferNew) bestVideoFormat = f;
  }

  if (bestVideoFormat?.itag) {
    availableFormats.push({
      itag: bestVideoFormat.itag,
      label: `MP4 - (${bestVideoFormat.height}p)`,
      type: 'video',
      quality: `${bestVideoFormat.height}p`,
    });
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
