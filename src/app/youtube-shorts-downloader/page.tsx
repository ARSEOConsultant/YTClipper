import ToolLandingPageTemplate from '@/components/ToolLandingPageTemplate';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'YouTube Shorts Downloader - Save Shorts as MP4',
  description: 'Download YouTube Shorts quickly and easily. Save short vertical videos in MP4 format to your mobile or desktop device.',
};

const faqs = [
  {
    question: "How do I get the Shorts URL?",
    answer: "On mobile, tap the Share button on the Short and select Copy Link. On desktop, you can copy the URL from your browser's address bar."
  },
  {
    question: "Do Shorts download in vertical format?",
    answer: "Yes, Shorts are downloaded in their native vertical aspect ratio, perfect for viewing on mobile devices."
  },
  {
    question: "Can I extract audio from Shorts?",
    answer: "Yes, just paste the URL and select the MP3 option instead of MP4."
  }
];

export default function YouTubeShortsDownloaderPage() {
  return (
    <ToolLandingPageTemplate
      h1="YouTube Shorts Downloader"
      subheading="Save your favourite YouTube Shorts directly to your device in high quality."
      path="/youtube-shorts-downloader"
      faqs={faqs}
      defaultFormat="mp4"
    />
  );
}
