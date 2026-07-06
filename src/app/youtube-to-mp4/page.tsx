import ToolLandingPageTemplate from '@/components/ToolLandingPageTemplate';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'YouTube to MP4 Downloader | Download HD Videos Free, No Signup',
  description: 'Download YouTube videos in MP4 up to 1080p Full HD. Perfect audio sync on every file. No login, no ads. Works on any device.',
};

const reasons = [
  {
    title: "True HD with Perfect Audio Sync",
    description: "YouTube stores video and audio separately for high-resolution formats. We automatically merge them using FFmpeg — so your 1080p download plays with perfectly synced sound from the first second."
  },
  {
    title: "Pick Your Quality",
    description: "360p for quick saves. 1080p for anything you'll actually watch. You choose. No forced compression."
  },
  {
    title: "Instant Playback",
    description: "We build your MP4 with the faststart flag enabled. Your video starts playing the moment the download begins — no waiting for the full file."
  }
];

const howItWorks = [
  "Paste your YouTube URL — Any public video works.",
  "Choose your resolution — 360p, 480p, 720p, or 1080p Full HD.",
  "We merge and package — Our server pulls the best available video and audio streams and combines them into a single MP4.",
  "Download directly — File lands on your device. Temp files deleted from our server after 15 minutes."
];

const perfectFor = [
  {
    title: "Students & Educators",
    description: "Download lectures, tutorials, and documentaries for offline study or classroom use. Stop depending on school WiFi to run a lesson."
  },
  {
    title: "Content Creators",
    description: "Back up your own uploaded videos. Edit clips into compilations, YouTube Shorts, or social media highlights. Reference footage without streaming lag."
  },
  {
    title: "Travelers",
    description: "Fill your device before boarding. Watch offline during flights, long train rides, or travel with no reliable connection."
  },
  {
    title: "Video Editors",
    description: "Source royalty-free footage from public domain YouTube channels. Download at full quality to edit without transcoding."
  },
  {
    title: "Archivists & Researchers",
    description: "Preserve video interviews, documentaries, and educational content before it's taken down. Build a personal offline library."
  },
  {
    title: "Marketers & Brand Managers",
    description: "Download your own brand video assets for repurposing. Archive competitor content or industry talks for reference."
  }
];

const faqs = [
  {
    question: "Why do other tools only give me 360p?",
    answer: "Downloading HD video from YouTube requires merging separate video and audio streams — most tools skip this step. We do it automatically."
  },
  {
    question: "How long does downloading take?",
    answer: "A 10-minute video in 1080p takes roughly 1–2 minutes on standard broadband. 360p downloads are usually under 30 seconds."
  },
  {
    question: "Do you store my videos?",
    answer: "No. We process files temporarily and delete them after 15 minutes. You download directly — we keep nothing."
  },
  {
    question: "Can I download playlists?",
    answer: "Currently we support single video downloads. Paste one URL at a time."
  },
  {
    question: "Is this legal?",
    answer: "Yes, if you own the content or have permission. We display a compliance reminder at download — please respect creators' rights."
  },
  {
    question: "What if the video isn't available in my chosen quality?",
    answer: "We'll show you what's available. If 1080p isn't offered by the creator, the highest available resolution is selected automatically."
  }
];

const finalCta = {
  headline: "Full quality. Full audio. Your device.",
  buttonText: "Download My Video"
};

export default function YouTubeToMp4Page() {
  return (
    <ToolLandingPageTemplate
      h1="Download YouTube videos up to 1080p Full HD. Audio included. Always."
      subheading="Most tools give you 360p or skip the audio on HD. We merge both streams so you get the full video, at full quality."
      path="/youtube-to-mp4"
      faqs={faqs}
      reasons={reasons}
      howItWorks={howItWorks}
      perfectFor={perfectFor}
      finalCta={finalCta}
      defaultFormat="mp4"
      videoOnly={true}
      hideTranscript={true}
    />
  );
}
