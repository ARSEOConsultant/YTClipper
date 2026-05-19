const ytdl = require('ytdl-core-enhanced');

async function test() {
  try {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    console.log('Fetching info...');
    const info = await ytdl.getInfo(url);
    console.log(`Found ${info.formats.length} formats`);
    
    const combined = info.formats.filter(f => f.hasVideo && f.hasAudio);
    console.log(`Found ${combined.length} combined formats`);
    
    if (combined.length > 0) {
      console.log('Best combined URL:', combined[0].url ? 'YES' : 'NO (Missing URL due to cipher)');
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

test();
