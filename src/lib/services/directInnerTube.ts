/**
 * Direct InnerTube client that bypasses ytdl-core-enhanced's broken InnerTube flow.
 *
 * Why this exists:
 * - ytdl-core-enhanced uses raw Node.js `https` for InnerTube API calls,
 *   which YouTube fingerprints as bots → returns only 360p.
 * - This module uses `fetch` (undici under the hood in Node 18+) with the
 *   authenticated cookie jar to make requests that look like a real browser.
 */

import { ProxyAgent, fetch as undiciFetch } from 'undici';

const proxyUrl = process.env.YOUTUBE_PROXY;
let dispatcher: InstanceType<typeof ProxyAgent> | undefined;
if (proxyUrl) {
  try {
    dispatcher = new ProxyAgent(proxyUrl.trim());
  } catch (e: any) {
    console.error('[directInnerTube] Invalid YOUTUBE_PROXY value, ignoring proxy:', e.message);
  }
}
const activeFetch = dispatcher ? undiciFetch : fetch;

// @ts-ignore
const decipherFormats = require('ytdl-core-enhanced/lib/innertube-clients').decipherFormats;
// @ts-ignore
const sigDecoder = require('ytdl-core-enhanced/lib/sig-decoder');

// Wire up the remote cipher server immediately so decipherFormats works without
// waiting for lazyAutoInit() (which only runs inside innertubeClients.getInfo).
const REMOTE_CIPHER_URL = 'https://cipher.kikkia.dev';
sigDecoder.setRemoteCipher(REMOTE_CIPHER_URL, '');

export interface InnerTubeFormat {
  itag: number;
  url?: string;
  mimeType: string;
  bitrate?: number;
  width?: number;
  height?: number;
  qualityLabel?: string;
  quality?: string;
  fps?: number;
  audioQuality?: string;
  audioSampleRate?: string;
  audioBitrate?: number;
  averageBitrate?: number;
  contentLength?: string;
  hasVideo: boolean;
  hasAudio: boolean;
  container: string;
  signatureCipher?: string;
  cipher?: string;
}

export interface InnerTubeResult {
  videoDetails: any;
  formats: InnerTubeFormat[];
  success: boolean;
  clientUsed: string;
}

/**
 * Build the cookie string from the YOUTUBE_COOKIES environment variable.
 */
export function buildCookieString(): string {
  const cookiesStr = process.env.YOUTUBE_COOKIES;
  if (!cookiesStr) {
    console.log('[DirectInnerTube] YOUTUBE_COOKIES env var is not defined');
    return '';
  }

  let clean = cookiesStr.trim();
  if (clean.startsWith("'") && clean.endsWith("'")) clean = clean.slice(1, -1).trim();
  if (clean.startsWith('"') && clean.endsWith('"')) clean = clean.slice(1, -1).trim();

  try {
    const cookies = JSON.parse(clean);
    if (!Array.isArray(cookies)) {
      console.error('[DirectInnerTube] Parsed cookies is not an array.');
      return '';
    }
    console.log(`[DirectInnerTube] Successfully loaded ${cookies.length} cookies for HTTP header injection.`);
    return cookies
      .map((c: any) => `${c.name}=${c.value}`)
      .join('; ');
  } catch (e: any) {
    console.error('[DirectInnerTube] Error parsing cookie JSON:', e.message || e, e.stack);
    return '';
  }
}

/**
 * Fetch the YouTube watch page HTML and extract player metadata.
 */
async function fetchWatchPage(videoId: string, cookieString: string): Promise<{
  html: string;
  visitorData: string;
  sts: number;
  clientVersion: string;
  apiKey: string | null;
  html5player: string | null;
}> {
  const url = `https://www.youtube.com/watch?v=${videoId}&bpctr=9999999999&has_verified=1`;

  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Sec-Fetch-Mode': 'navigate',
  };
  if (cookieString) {
    headers['Cookie'] = cookieString;
  }

  const fetchOpts: any = { headers };
  if (dispatcher) fetchOpts.dispatcher = dispatcher;

  const res = await activeFetch(url, fetchOpts);
  console.log(`[DirectInnerTube] fetchWatchPage status for ${videoId}: ${res.status}`);
  const html = await res.text();

  const visitorMatch = html.match(/"VISITOR_DATA"\s*:\s*"([^"]+)"/);
  const visitorData = visitorMatch ? visitorMatch[1] : '';

  const stsMatch = html.match(/(?:signatureTimestamp|sts)\s*:\s*(\d+)/);
  const sts = stsMatch ? parseInt(stsMatch[1]) : 20481;

  const html5playerRes = /<script\s+src="([^"]+)"(?:\s+type="text\/javascript")?\s+name="player_ias\/base"\s*>|"jsUrl":"([^"]+)"/.exec(html);
  const html5player = html5playerRes?.[1] || html5playerRes?.[2] || null;

  let clientVersion = '2.20260128.01.00';
  let apiKey: string | null = null;
  const configMatch = html.match(/ytcfg\.set\((\{.+?\})\);/);
  if (configMatch) {
    try {
      const config = JSON.parse(configMatch[1]);
      if (config.INNERTUBE_CONTEXT?.client?.clientVersion) {
        clientVersion = config.INNERTUBE_CONTEXT.client.clientVersion;
      }
      if (config.INNERTUBE_API_KEY) {
        apiKey = config.INNERTUBE_API_KEY;
      }
    } catch (_e) { /* ignore */ }
  }

  return { html, visitorData, sts, clientVersion, apiKey, html5player };
}

/**
 * Extract player_response from the watch page HTML.
 */
function extractPlayerResponse(html: string): any {
  const patterns = [
    /var ytInitialPlayerResponse\s*=\s*(\{[\s\S]+?\});/,
    /window\["ytInitialPlayerResponse"\]\s*=\s*(\{[\s\S]+?\});/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (_e) {
        try {
          const json = cutAfterJS(match[1]);
          return JSON.parse(json);
        } catch (_e2) { /* continue */ }
      }
    }
  }
  return null;
}

function cutAfterJS(mixedJson: string): string {
  let open: string, close: string;
  if (mixedJson[0] === '[') { open = '['; close = ']'; }
  else if (mixedJson[0] === '{') { open = '{'; close = '}'; }
  else throw new Error('Invalid JSON start');

  let counter = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < mixedJson.length; i++) {
    const char = mixedJson[i];
    if (escaped) { escaped = false; continue; }
    if (char === '\\') { escaped = true; continue; }
    if (char === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (char === open) counter++;
    if (char === close) counter--;
    if (counter === 0) return mixedJson.substring(0, i + 1);
  }
  return mixedJson;
}

/**
 * Make an InnerTube WEB player API request.
 */
async function requestWebPlayer(
  videoId: string,
  cookieString: string,
  visitorData: string,
  sts: number,
  clientVersion: string,
): Promise<any> {
  const requestBody = {
    context: {
      client: {
        clientName: 'WEB',
        clientVersion,
        platform: 'DESKTOP',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        browserName: 'Chrome',
        browserVersion: '131.0.0.0',
        osName: 'Windows',
        osVersion: '10.0',
        hl: 'en',
        gl: 'US',
        timeZone: 'UTC',
        utcOffsetMinutes: 0,
      },
      request: { internalExperimentFlags: [], useSsl: true },
      user: { lockedSafetyMode: false },
    },
    videoId,
    playbackContext: {
      contentPlaybackContext: {
        html5Preference: 'HTML5_PREF_WANTS',
        signatureTimestamp: sts,
      },
    },
    contentCheckOk: true,
    racyCheckOk: true,
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'X-Youtube-Client-Name': '1',
    'X-Youtube-Client-Version': clientVersion,
    'Origin': 'https://www.youtube.com',
    'Referer': `https://www.youtube.com/watch?v=${videoId}`,
    'X-Goog-Visitor-Id': visitorData,
  };
  if (cookieString) {
    headers['Cookie'] = cookieString;
  }

  const fetchOpts: any = {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  };
  if (dispatcher) fetchOpts.dispatcher = dispatcher;

  const res = await activeFetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', fetchOpts);

  return res.json();
}

/**
 * Make an InnerTube ANDROID client player API request.
 */
async function requestAndroidPlayer(
  videoId: string,
  cookieString: string,
  visitorData: string,
  sts: number,
): Promise<any> {
  const requestBody = {
    context: {
      client: {
        clientName: 'ANDROID',
        clientVersion: '19.30.36',
        platform: 'MOBILE',
        osName: 'Android',
        osVersion: '14',
        androidSdkVersion: 34,
        userAgent: 'com.google.android.youtube/19.30.36 (Linux; U; Android 14; en_US) gzip',
        hl: 'en',
        gl: 'US',
        timeZone: 'UTC',
        utcOffsetMinutes: 0,
      },
      request: { internalExperimentFlags: [], useSsl: true },
      user: { lockedSafetyMode: false },
    },
    videoId,
    playbackContext: {
      contentPlaybackContext: {
        html5Preference: 'HTML5_PREF_WANTS',
        signatureTimestamp: sts,
      },
    },
    contentCheckOk: true,
    racyCheckOk: true,
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'com.google.android.youtube/19.30.36 (Linux; U; Android 14; en_US) gzip',
    'X-Youtube-Client-Name': '3',
    'X-Youtube-Client-Version': '19.30.36',
    'Origin': 'https://www.youtube.com',
    'X-Goog-Visitor-Id': visitorData,
  };
  if (cookieString) {
    headers['Cookie'] = cookieString;
  }

  const fetchOpts: any = {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  };
  if (dispatcher) fetchOpts.dispatcher = dispatcher;

  const res = await activeFetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', fetchOpts);

  return res.json();
}

/**
 * Parse raw YouTube formats into our InnerTubeFormat interface.
 */
function parseFormats(rawFormats: any[]): InnerTubeFormat[] {
  return rawFormats.map((f: any) => ({
    itag: f.itag,
    url: f.url,
    mimeType: f.mimeType || '',
    bitrate: f.bitrate,
    width: f.width,
    height: f.height,
    qualityLabel: f.qualityLabel,
    quality: f.quality,
    fps: f.fps,
    audioQuality: f.audioQuality,
    audioSampleRate: f.audioSampleRate,
    audioBitrate: f.averageBitrate ? Math.round(f.averageBitrate / 1000) : (f.audioBitrate || undefined),
    averageBitrate: f.averageBitrate,
    contentLength: f.contentLength,
    hasVideo: f.mimeType ? f.mimeType.startsWith('video/') : !!f.height,
    hasAudio: !!f.audioQuality || !!f.audioSampleRate || (f.mimeType ? f.mimeType.startsWith('audio/') : false),
    container: f.mimeType ? f.mimeType.split(';')[0].split('/')[1] : 'unknown',
    signatureCipher: f.signatureCipher,
    cipher: f.cipher,
  } as InnerTubeFormat));
}

/**
 * Decipher formats using innertube-clients' decipherFormats which uses
 * sig-decoder with auto-fetched current player URL.
 */
async function decipherAllFormats(formats: InnerTubeFormat[], playerUrl: string | null): Promise<InnerTubeFormat[]> {
  try {
    const deciphered = await decipherFormats(formats, playerUrl);
    return deciphered as InnerTubeFormat[];
  } catch (e: any) {
    console.error('[DirectInnerTube] decipherFormats failed:', e.message);
    return formats;
  }
}

/**
 * Main entry point: fetch video info with HD formats using direct InnerTube calls.
 * Works with or without cookies — unauthenticated requests still return format metadata.
 */
export async function getVideoInfoDirect(videoId: string): Promise<InnerTubeResult | null> {
  const cookieString = buildCookieString();

  if (!cookieString) {
    console.log('[DirectInnerTube] No cookies — trying anonymous watch-page fetch');
  } else {
    console.log('[DirectInnerTube] Fetching watch page with cookies...');
  }

  let html = '';
  let visitorData = '';
  let sts = 20481;
  let clientVersion = '2.20260128.01.00';
  let html5player: string | null = null;

  try {
    const page = await fetchWatchPage(videoId, cookieString);
    html = page.html;
    visitorData = page.visitorData;
    sts = page.sts;
    clientVersion = page.clientVersion;
    html5player = page.html5player;
  } catch (e: any) {
    console.error('[DirectInnerTube] Watch page fetch failed:', e.message);
    return null;
  }

  const playerUrl = html5player
    ? new URL(html5player, 'https://www.youtube.com').toString()
    : null;

  if (playerUrl) {
    console.log(`[DirectInnerTube] html5player: ${playerUrl}`);
  } else {
    console.warn('[DirectInnerTube] Could not find html5player — will use sig-decoder auto-fetch');
  }

  // ── Step 1: Extract player_response from watch page HTML ──
  const playerResponse = extractPlayerResponse(html);
  const watchPageFormats = playerResponse?.streamingData?.formats || [];
  const watchPageAdaptiveFormats = playerResponse?.streamingData?.adaptiveFormats || [];
  const allWatchPageFormats = [...watchPageFormats, ...watchPageAdaptiveFormats];

  console.log(`[DirectInnerTube] Watch page: ${allWatchPageFormats.length} formats (${watchPageFormats.length} combined + ${watchPageAdaptiveFormats.length} adaptive)`);

  if (allWatchPageFormats.length > 3) {
    console.log('[DirectInnerTube] Watch page has sufficient formats — deciphering...');
    const parsed = parseFormats(allWatchPageFormats);
    const deciphered = await decipherAllFormats(parsed, playerUrl);
    const withUrl = deciphered.filter(f => f.url);
    console.log(`[DirectInnerTube] WEB_PAGE: ${withUrl.length}/${parsed.length} formats have URLs after decipher`);

    if (withUrl.length > 1) {
      return {
        videoDetails: playerResponse.videoDetails,
        formats: withUrl,
        success: true,
        clientUsed: 'WEB_PAGE',
      };
    }
  }

  // ── Step 2: Try InnerTube WEB client API ──
  console.log('[DirectInnerTube] Trying WEB InnerTube API...');
  try {
    const webData = await requestWebPlayer(videoId, cookieString, visitorData, sts, clientVersion);
    if (webData?.playabilityStatus?.status === 'OK' && webData?.streamingData) {
      const webFormats = [
        ...(webData.streamingData.formats || []),
        ...(webData.streamingData.adaptiveFormats || []),
      ];
      console.log(`[DirectInnerTube] WEB client: ${webFormats.length} formats`);
      if (webFormats.length > 1) {
        const parsed = parseFormats(webFormats);
        const deciphered = await decipherAllFormats(parsed, playerUrl);
        const withUrl = deciphered.filter(f => f.url);
        console.log(`[DirectInnerTube] WEB: ${withUrl.length}/${parsed.length} formats have URLs`);
        if (withUrl.length > 1) {
          return {
            videoDetails: webData.videoDetails || playerResponse?.videoDetails,
            formats: withUrl,
            success: true,
            clientUsed: 'WEB',
          };
        }
      }
    } else {
      console.log('[DirectInnerTube] WEB client failed. PlayabilityStatus:', JSON.stringify(webData?.playabilityStatus));
    }
  } catch (e: any) {
    console.error('[DirectInnerTube] WEB client error:', e.message);
  }

  // ── Step 3: Try ANDROID client ──
  console.log('[DirectInnerTube] Trying ANDROID InnerTube API...');
  try {
    const androidData = await requestAndroidPlayer(videoId, cookieString, visitorData, sts);
    if (androidData?.playabilityStatus?.status === 'OK' && androidData?.streamingData) {
      const androidFormats = [
        ...(androidData.streamingData.formats || []),
        ...(androidData.streamingData.adaptiveFormats || []),
      ];
      console.log(`[DirectInnerTube] ANDROID client: ${androidFormats.length} formats`);
      if (androidFormats.length > 0) {
        const parsed = parseFormats(androidFormats);
        const deciphered = await decipherAllFormats(parsed, playerUrl);
        const withUrl = deciphered.filter(f => f.url);
        console.log(`[DirectInnerTube] ANDROID: ${withUrl.length}/${parsed.length} formats have URLs`);
        if (withUrl.length > 0) {
          return {
            videoDetails: androidData.videoDetails || playerResponse?.videoDetails,
            formats: withUrl,
            success: true,
            clientUsed: 'ANDROID',
          };
        }
      }
    } else {
      console.log('[DirectInnerTube] ANDROID client failed. PlayabilityStatus:', JSON.stringify(androidData?.playabilityStatus));
    }
  } catch (e: any) {
    console.error('[DirectInnerTube] ANDROID client error:', e.message);
  }

  // ── Step 4: Fall back to watch page formats ──
  if (allWatchPageFormats.length > 0) {
    console.log('[DirectInnerTube] All API clients failed — using watch page formats as fallback');
    const parsed = parseFormats(allWatchPageFormats);
    const deciphered = await decipherAllFormats(parsed, playerUrl);
    return {
      videoDetails: playerResponse?.videoDetails,
      formats: deciphered.filter(f => f.url),
      success: deciphered.filter(f => f.url).length > 0,
      clientUsed: 'WEB_PAGE_FALLBACK',
    };
  }

  console.error('[DirectInnerTube] All methods failed — no formats available');
  return null;
}
