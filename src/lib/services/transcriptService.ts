import { YoutubeTranscript } from 'youtube-transcript';
import https from 'https';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { getStickyProxyUrl, generateSessionId, getRawProxyUrl } from './ytdlpService';

function getCookieHeader(): string {
  const cookiesStr = process.env.YOUTUBE_COOKIES;
  if (!cookiesStr) return '';
  let clean = cookiesStr.trim();
  if (clean.startsWith("'") && clean.endsWith("'")) clean = clean.slice(1, -1).trim();
  if (clean.startsWith('"') && clean.endsWith('"')) clean = clean.slice(1, -1).trim();
  try {
    const cookies = JSON.parse(clean);
    if (!Array.isArray(cookies)) return '';
    return cookies.map((c: any) => `${c.name}=${c.value}`).join('; ');
  } catch (e) {
    return '';
  }
}

const cookieHeader = getCookieHeader();

function customFetch(url: string, options: any = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const sessionId = generateSessionId();
    const proxyUrl = getStickyProxyUrl(sessionId) || getRawProxyUrl();
    const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

    const headers = { ...options.headers };
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    const reqOptions: https.RequestOptions = {
      method: options.method || 'GET',
      headers: headers,
      agent: agent,
      timeout: 15000,
    };

    const req = https.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          ok: res.statusCode ? res.statusCode >= 200 && res.statusCode < 300 : false,
          status: res.statusCode,
          text: async () => data,
          json: async () => {
            try {
              return JSON.parse(data);
            } catch (_) {
              return {};
            }
          },
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

/**
 * Fetches transcript for a given YouTube video.
 */
export async function getTranscript(url: string): Promise<{ text: string; language: string; isAvailable: boolean }> {
  try {
    const transcriptList = await YoutubeTranscript.fetchTranscript(url, {
      fetch: customFetch as any
    });
    
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
