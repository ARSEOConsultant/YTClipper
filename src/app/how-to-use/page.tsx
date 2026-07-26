const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ytclipper.com';

export const metadata = {
  title: 'How to Use YTClipper',
  description: 'Learn how to use YTClipper to download YouTube videos, extract MP3s, and download transcripts.',
  alternates: { canonical: `${SITE_URL}/how-to-use` },
};

export default function HowToUsePage() {
  return (
    <div className="max-w-3xl mx-auto py-16 px-4 prose prose-zinc">
      <h1 className="text-3xl font-bold tracking-tight mb-8">How to Use YTClipper</h1>
      
      <div className="space-y-8 text-zinc-600 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3">1. Copy the Video URL</h2>
          <p>Find the YouTube video or Short you want to process. Copy the URL from your browser&apos;s address bar, or use the &quot;Share&quot; button and select &quot;Copy Link&quot;.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3">2. Paste the Link</h2>
          <p>Return to YTClipper and paste the link into the large input box on the homepage. Click the &quot;Download&quot; button.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3">3. Choose Your Format</h2>
          <p>Once the video metadata loads, you will see the video title and thumbnail. Select one of the available options:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Download MP4:</strong> Saves the high-definition video file to your device.</li>
            <li><strong>Extract MP3:</strong> Extracts the highest quality audio track and saves it as an MP3.</li>
            <li><strong>Get Transcript:</strong> Downloads the video captions (if available) as a plain text file.</li>
          </ul>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-3">4. Wait for Processing</h2>
          <p>Depending on the length of the video and current server load, processing may take a few moments. Once finished, your download will begin automatically.</p>
        </section>
      </div>
    </div>
  );
}
