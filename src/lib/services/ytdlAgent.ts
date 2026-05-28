// @ts-ignore
import ytdl from 'ytdl-core-enhanced';

let agent: any = undefined;

if (typeof window === 'undefined') {
  const cookiesStr = process.env.YOUTUBE_COOKIES;

  if (cookiesStr) {
    // Clean any surrounding single/double quotes added by Dotenv/Next.js
    let cleanCookiesStr = cookiesStr.trim();
    if (cleanCookiesStr.startsWith("'") && cleanCookiesStr.endsWith("'")) {
      cleanCookiesStr = cleanCookiesStr.slice(1, -1).trim();
    }
    if (cleanCookiesStr.startsWith('"') && cleanCookiesStr.endsWith('"')) {
      cleanCookiesStr = cleanCookiesStr.slice(1, -1).trim();
    }

    console.log('[DEBUG] process.env.YOUTUBE_COOKIES value start:', cleanCookiesStr.slice(0, 100));

    if (cleanCookiesStr && cleanCookiesStr !== 'PASTE_YOUR_JSON_COOKIES_HERE') {
      try {
        const cookies = JSON.parse(cleanCookiesStr);
        if (Array.isArray(cookies)) {
          agent = ytdl.createAgent(cookies);
          console.log('Successfully created ytdl-core-enhanced agent using environment cookies.');
        }
      } catch (error) {
        console.error('Error parsing YOUTUBE_COOKIES env variable:', error);
      }
    } else {
      console.log('[DEBUG] YOUTUBE_COOKIES is empty or contains the default placeholder.');
    }
  } else {
    console.log('[DEBUG] YOUTUBE_COOKIES env variable is not defined.');
  }
}

/**
 * Returns options for ytdl-core-enhanced.
 * "WEB" uses the authenticated watch-page player response (all resolutions).
 * "ANDROID_VR" and "IOS" return direct URLs for adaptive formats without cipher.
 * After the info.js html5player fix, "WEB" decipher works with the correct player URL.
 */
export function getYtdlOptions() {
  const opts: any = {
    playerClients: ["WEB_API", "ANDROID_VR"],
  };
  if (agent) {
    opts.agent = agent;
  }
  return opts;
}

export { ytdl };
