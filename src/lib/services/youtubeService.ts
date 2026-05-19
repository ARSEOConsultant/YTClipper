// @ts-ignore
import ytdl from 'ytdl-core-enhanced';

export interface FormatOption {
  itag: number;
  label: string;
  type: 'video' | 'audio';
  quality: string;
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

/**
 * Parses a YouTube URL and returns the video ID and type.
 */
export function parseYouTubeUrl(url: string): { id: string; type: 'video' | 'shorts' } | null {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace('www.', '');

    // Handle youtu.be/<id>
    if (hostname === 'youtu.be') {
      const id = parsedUrl.pathname.slice(1);
      return id ? { id, type: 'video' } : null;
    }

    // Handle youtube.com
    if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      // Handle shorts
      if (parsedUrl.pathname.startsWith('/shorts/')) {
        const id = parsedUrl.pathname.split('/')[2];
        return id ? { id, type: 'shorts' } : null;
      }

      // Handle standard watch URLs
      if (parsedUrl.pathname === '/watch') {
        const id = parsedUrl.searchParams.get('v');
        return id ? { id, type: 'video' } : null;
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Validates if the provided string is a valid YouTube URL.
 */
export function validateYouTubeUrl(url: string): boolean {
  return parseYouTubeUrl(url) !== null;
}

/**
 * Fetches video metadata using ytdl-core.
 */
export async function getVideoMetadata(url: string): Promise<VideoMetadata | null> {
  const parsed = parseYouTubeUrl(url);
  if (!parsed) return null;

  try {
    const info = await ytdl.getInfo(url);
    const videoDetails = info.videoDetails;

    // Format duration from seconds to MM:SS or HH:MM:SS
    const totalSeconds = parseInt(videoDetails.lengthSeconds, 10);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    let duration = '';
    if (hours > 0) {
      duration += `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      duration += `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Get best thumbnail
    const thumbnails = videoDetails.thumbnails || [];
    const bestThumbnail = thumbnails.length > 0 ? thumbnails[thumbnails.length - 1].url : '';

    // Extract Formats
    const availableFormats: FormatOption[] = [];
    
    // De-duplicate video formats by height (resolution)
    // Prioritize formats that have both video and audio
    const videoFormatsMap = new Map<number, any>();
    if (info.formats && Array.isArray(info.formats)) {
      info.formats.forEach((f: any) => {
        if (f.hasVideo && f.height) {
          const existing = videoFormatsMap.get(f.height);
          if (!existing || (f.hasAudio && !existing.hasAudio)) {
            videoFormatsMap.set(f.height, f);
          }
        }
      });
    }

    const sortedVideoFormats = Array.from(videoFormatsMap.values())
      .sort((a: any, b: any) => (b.height || 0) - (a.height || 0));
      
    sortedVideoFormats.forEach((f: any) => {
      if (f.itag && f.height) {
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
    });

    // Sort audio-only formats by bitrate
    const audioFormats = (info.formats || [])
      .filter((f: any) => !f.hasVideo && f.hasAudio)
      .sort((a: any, b: any) => (b.audioBitrate || 0) - (a.audioBitrate || 0));
      
    audioFormats.forEach((f: any) => {
      if (f.itag && f.audioBitrate) {
        availableFormats.push({
          itag: f.itag,
          label: `Audio - ${f.audioBitrate}kbps (${f.container || 'webm'})`,
          type: 'audio',
          quality: `${f.audioBitrate}kbps`,
        });
      }
    });

    return {
      id: videoDetails.videoId,
      title: videoDetails.title,
      channelTitle: videoDetails.author.name,
      channelUrl: videoDetails.author.channel_url,
      description: videoDetails.description ? videoDetails.description.slice(0, 150) + (videoDetails.description.length > 150 ? '...' : '') : undefined,
      thumbnailUrl: bestThumbnail,
      duration,
      type: parsed.type,
      availableFormats,
    };
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return null;
  }
}
