import ToolLandingPageTemplate from '@/components/ToolLandingPageTemplate';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'YouTube Transcript Downloader - Download Video Text',
  description: 'Extract and download text transcripts from YouTube videos instantly. Save captions as TXT files for reading or analysis.',
};

const faqs = [
  {
    question: "What format is the transcript saved in?",
    answer: "The transcript is saved as a plain text (.txt) file, making it easy to open on any device."
  },
  {
    question: "Does it include timestamps?",
    answer: "Yes, our transcript extraction preserves the original timestamps from the video."
  },
  {
    question: "What if the video has no captions?",
    answer: "If the video does not have closed captions or auto-generated subtitles available, we won't be able to extract a transcript."
  }
];

export default function YouTubeTranscriptDownloaderPage() {
  return (
    <ToolLandingPageTemplate
      h1="YouTube Transcript Downloader"
      subheading="Extract text and captions from YouTube videos and save them as plain text files."
      path="/youtube-transcript-downloader"
      faqs={faqs}
      defaultFormat="transcript"
    />
  );
}
