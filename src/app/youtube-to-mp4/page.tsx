import ToolLandingPageTemplate from '@/components/ToolLandingPageTemplate';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'YouTube to MP4 Downloader - Download Videos Online',
  description: 'Download YouTube videos in high-quality MP4 format for free. Save your favourite videos directly to your device.',
};

const faqs = [
  {
    question: "What resolutions are supported?",
    answer: "We support downloading videos up to 1080p HD, depending on the original quality of the uploaded video."
  },
  {
    question: "Does this work on mobile?",
    answer: "Yes, our tool is fully responsive and works perfectly on mobile browsers (iOS and Android)."
  },
  {
    question: "Are the downloaded files safe?",
    answer: "Absolutely. The files are provided exactly as they are sourced, with no added software or malware."
  }
];

export default function YouTubeToMp4Page() {
  return (
    <ToolLandingPageTemplate
      h1="YouTube to MP4 Downloader"
      subheading="Download high-definition MP4 videos from YouTube for offline viewing."
      path="/youtube-to-mp4"
      faqs={faqs}
      defaultFormat="mp4"
    />
  );
}
