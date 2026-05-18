import ytdl from '@distube/ytdl-core';

export interface VideoMetadata {
  id: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  duration: string; // e.g., "10:35"
  type: 'video' | 'shorts';
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
    const info = await ytdl.getBasicInfo(url);
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

    return {
      id: videoDetails.videoId,
      title: videoDetails.title,
      channelTitle: videoDetails.author.name,
      thumbnailUrl: bestThumbnail,
      duration,
      type: parsed.type,
    };
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return null;
  }
}
