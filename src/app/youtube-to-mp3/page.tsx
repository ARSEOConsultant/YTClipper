import ToolLandingPageTemplate from '@/components/ToolLandingPageTemplate';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'YouTube to MP3 Converter - Extract Audio Online',
  description: 'Fast and free YouTube to MP3 converter. Extract high-quality audio from your YouTube videos online without installing any software.',
};

const faqs = [
  {
    question: "How do I convert a YouTube video to MP3?",
    answer: "Simply paste the YouTube video URL into the input box above and click Download. Once the video is processed, select the Extract MP3 option."
  },
  {
    question: "Is the audio quality good?",
    answer: "Yes, we extract the highest available quality audio track directly from the video source."
  },
  {
    question: "Can I convert long videos?",
    answer: "Yes, though very long videos may take slightly longer to process depending on current server load."
  }
];

export default function YouTubeToMp3Page() {
  return (
    <ToolLandingPageTemplate
      h1="YouTube to MP3 Converter"
      subheading="Extract high-quality MP3 audio from your authorised YouTube videos instantly."
      path="/youtube-to-mp3"
      faqs={faqs}
      defaultFormat="mp3"
    />
  );
}
