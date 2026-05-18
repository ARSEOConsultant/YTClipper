import { YoutubeTranscript } from 'youtube-transcript';

/**
 * Fetches transcript for a given YouTube video.
 */
export async function getTranscript(url: string): Promise<{ text: string; language: string; isAvailable: boolean }> {
  try {
    const transcriptList = await YoutubeTranscript.fetchTranscript(url);
    
    if (!transcriptList || transcriptList.length === 0) {
      return { isAvailable: false, language: '', text: '' };
    }

    // Convert to plain text with timestamps
    const formattedText = transcriptList.map(t => {
      // Format offset (ms) to MM:SS
      const totalSeconds = Math.floor(t.offset / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      // Clean up text
      const cleanText = t.text.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
      
      return `${timestamp} ${cleanText}`;
    }).join('\n');

    return {
      isAvailable: true,
      language: 'en', // default, could be dynamic if we parsed the full API
      text: formattedText
    };
  } catch (error) {
    console.error('Transcript error:', error);
    return { isAvailable: false, language: '', text: '' };
  }
}

/**
 * Utility to convert transcript text to a blob for downloading.
 */
export function exportTranscriptAsTxt(text: string): Blob {
  return new Blob([text], { type: 'text/plain;charset=utf-8' });
}
