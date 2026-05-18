import ytdl from '@distube/ytdl-core';

/**
 * Prepares an MP4 download for a given YouTube URL.
 * Returns the direct expiring Google Video URL for the client to download.
 */
export async function prepareMp4Download(url: string, quality: string = '1080p'): Promise<{ downloadUrl: string; filename: string }> {
  try {
    const info = await ytdl.getInfo(url);
    
    // For free MVP without FFmpeg muxing, we can only provide formats that have BOTH video and audio natively.
    // Usually this caps at 720p for YouTube.
    const format = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'videoandaudio' });
    
    if (!format || !format.url) {
      throw new Error('Could not find a suitable MP4 format.');
    }

    const safeTitle = info.videoDetails.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    return {
      downloadUrl: format.url,
      filename: `ytclipper_${safeTitle}.mp4`
    };
  } catch (error: any) {
    console.error('Error preparing MP4:', error);
    throw new Error(error.message || 'Failed to extract MP4');
  }
}

/**
 * Extracts audio for a given YouTube URL.
 * Returns the direct expiring Google Video URL for the client to download.
 */
export async function extractMp3Audio(url: string): Promise<{ downloadUrl: string; filename: string }> {
  try {
    const info = await ytdl.getInfo(url);
    
    // Get highest quality audio-only format
    const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });
    
    if (!format || !format.url) {
      throw new Error('Could not find a suitable audio format.');
    }

    const safeTitle = info.videoDetails.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    // We return .webm or .m4a based on format, but label it audio. 
    // True MP3 requires FFmpeg conversion, but m4a/webm plays natively everywhere.
    const ext = format.container === 'mp4' ? 'm4a' : format.container;

    return {
      downloadUrl: format.url,
      filename: `ytclipper_${safeTitle}_audio.${ext}`
    };
  } catch (error: any) {
    console.error('Error extracting audio:', error);
    throw new Error(error.message || 'Failed to extract audio');
  }
}

/**
 * Returns available qualities.
 */
export async function getAvailableQualities(url: string): Promise<string[]> {
  return ['1080p', '720p', '480p', '360p']; // Simplified for MVP UI
}
