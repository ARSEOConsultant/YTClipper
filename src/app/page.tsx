import ToolLandingPageTemplate from '@/components/ToolLandingPageTemplate';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'YouTube Downloader | Free HD Video, MP3, Shorts & Transcripts | No Signup',
  description: 'Download YouTube videos up to 1080p HD, convert audio to MP3, save Shorts, and extract transcripts. Free, no login, no ads. Works on any device.',
};

const reasons = [
  {
    title: "True HD Quality",
    description: "We merge video and audio at their highest bitrates. You get crisp 1080p with perfectly synced sound. Most competitors max out at 360p or drop audio entirely on HD."
  },
  {
    title: "Works Without Internet",
    description: "Download once, watch anytime. On planes, trains, camping trips, or anywhere you don't have a connection."
  },
  {
    title: "Zero Friction",
    description: "Paste a link. Pick your quality. Download. No login, no email confirmation, no premium upsell. Takes 30 seconds."
  }
];

const howItWorks = [
  "Paste your YouTube URL — Any video, any channel.",
  "Choose your quality — 360p, 480p, 720p, or 1080p Full HD.",
  "Download your MP4 — Instant playback starts as it downloads."
];

const perfectFor = [
  {
    title: "Students & Teachers",
    description: "Download educational videos, lectures, and documentaries for offline study and classroom presentations. No internet dependency."
  },
  {
    title: "Content Creators",
    description: "Back up your own uploads instantly. Edit clips for compilations, highlight reels, or repurposing across platforms."
  },
  {
    title: "Travelers",
    description: "Load up entertainment for long flights, trains, or road trips without burning through mobile data or relying on spotty WiFi."
  },
  {
    title: "Video Editors & Filmmakers",
    description: "Source royalty-free footage from public domain and creative commons YouTube channels. Download in full quality for professional projects."
  },
  {
    title: "Archivists & Researchers",
    description: "Preserve important videos before they disappear. Create your own digital library of documentaries, interviews, and cultural content."
  },
  {
    title: "Educators Offline",
    description: "Download educational content for classrooms without internet. Create custom video libraries for your curriculum."
  }
];

const comparison = {
  headline: "Why Your Current Method Isn't Working",
  items: [
    {
      competitor: "Screen Recording?",
      solutions: "Drains battery, requires active screen time, compresses quality."
    },
    {
      competitor: "YouTube Studio?",
      solutions: "Only works on your own uploads."
    },
    {
      competitor: "Those \"Free Downloader\" Sites?",
      solutions: "Ads, pop-ups, random redirects, and tracking scripts that slow your device."
    }
  ],
  footerText: "Here's the difference: No ads. No tracking. No gimmicks. A clean tool that respects your privacy."
};

const faqs = [
  {
    question: "Is this legal?",
    answer: "Downloading content you own or have permission to download is legal. We include a compliance reminder — respect creators' rights and platform terms."
  },
  {
    question: "What quality options do I get?",
    answer: "360p, 480p, 720p, and 1080p Full HD. Higher quality means larger file and longer download. Pick what works for your device."
  },
  {
    question: "Will you sell my data?",
    answer: "No. We don't collect emails, track downloads, or sell anything. Your data isn't valuable to us — our service is."
  },
  {
    question: "Do you store my downloads?",
    answer: "No. Files are temporarily processed on our servers and deleted after 15 minutes. You get a direct download link; we don't keep copies."
  }
];

const finalCta = {
  headline: "Need a video offline? You're two clicks away.",
  buttonText: "Start Downloading"
};

export default function Home() {
  return (
    <ToolLandingPageTemplate
      h1="Download YouTube videos in Full HD. No signup. No compromise on quality."
      subheading="Get up to 1080p MP4 files with perfect audio sync. Works offline. Works everywhere."
      path="/"
      faqs={faqs}
      reasons={reasons}
      howItWorks={howItWorks}
      perfectFor={perfectFor}
      comparison={comparison}
      finalCta={finalCta}
    />
  );
}
