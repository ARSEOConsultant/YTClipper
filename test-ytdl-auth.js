const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const ytdl = require('./node_modules/ytdl-core-enhanced');

// Load environment variables from .env.local
const envLocalPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

async function test() {
  try {
    const cookiesStr = process.env.YOUTUBE_COOKIES;
    if (!cookiesStr) {
      console.error('YOUTUBE_COOKIES not found in env variables.');
      return;
    }

    let cleanCookiesStr = cookiesStr.trim();
    if (cleanCookiesStr.startsWith("'") && cleanCookiesStr.endsWith("'")) {
      cleanCookiesStr = cleanCookiesStr.slice(1, -1).trim();
    }
    if (cleanCookiesStr.startsWith('"') && cleanCookiesStr.endsWith('"')) {
      cleanCookiesStr = cleanCookiesStr.slice(1, -1).trim();
    }

    const cookies = JSON.parse(cleanCookiesStr);
    const agent = ytdl.createAgent(cookies);
    console.log('Successfully created agent.');

    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    console.log('Fetching info for', url, '...');
    const info = await ytdl.getInfo(url, { agent });
    console.log(`Successfully fetched info! Found ${info.formats.length} formats.`);

    console.log('\n--- Available Formats & Resolutions ---');
    const formatsGrouped = {};
    for (const f of info.formats) {
      const res = f.height ? `${f.height}p` : 'audio-only';
      if (!formatsGrouped[res]) {
        formatsGrouped[res] = [];
      }
      formatsGrouped[res].push({
        itag: f.itag,
        container: f.container,
        hasVideo: f.hasVideo,
        hasAudio: f.hasAudio,
        qualityLabel: f.qualityLabel,
        audioBitrate: f.audioBitrate,
        _client: f._client
      });
    }

    for (const [res, list] of Object.entries(formatsGrouped)) {
      console.log(`Resolution: ${res}`);
      for (const item of list) {
        console.log(`  - itag: ${item.itag}, container: ${item.container}, video: ${item.hasVideo}, audio: ${item.hasAudio}, client: ${item._client}`);
      }
    }

  } catch (error) {
    console.error('Error during test:', error);
  }
}

test();
