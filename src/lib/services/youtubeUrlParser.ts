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
