import ToolLandingPageTemplate from '@/components/ToolLandingPageTemplate';

const faqs = [
  {
    question: "Is this tool free to use?",
    answer: "Yes, YTClipper is completely free to use for processing your own videos or those licensed for reuse."
  },
  {
    question: "What formats are supported?",
    answer: "You can download videos in MP4 format, extract audio as MP3, or download the transcript as a TXT file."
  },
  {
    question: "Do I need an account?",
    answer: "No, you don't need to create an account or log in to use the basic features of this tool."
  },
  {
    question: "Are there any limitations?",
    answer: "To prevent abuse, there are standard rate limits in place. Also, we do not support downloading videos protected by DRM or those requiring a login."
  }
];

export default function Home() {
  return (
    <ToolLandingPageTemplate
      h1="YouTube Video Downloader"
      subheading="Download authorised YouTube videos in MP4, extract MP3 audio, and save video transcripts online."
      path="/"
      faqs={faqs}
    />
  );
}
