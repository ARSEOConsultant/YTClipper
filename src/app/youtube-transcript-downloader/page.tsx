import ToolLandingPageTemplate from '@/components/ToolLandingPageTemplate';
import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ytclipper.com';

export const metadata: Metadata = {
  title: 'YouTube Transcript Downloader | Extract Captions & Subtitles to TXT | Free',
  description: 'Download YouTube video transcripts as searchable text files with timestamps. No signup. Works with captions, subtitles, and auto-generated text. Not available for Shorts.',
  alternates: { canonical: `${SITE_URL}/youtube-transcript-downloader` },
};

const reasons = [
  {
    title: "Instant Searchability",
    description: "Find exact quotes in seconds instead of scrubbing through 2-hour videos. Download the text, open in any editor, and Ctrl+F what you need."
  },
  {
    title: "Clean, Readable Formatting",
    description: "We strip out HTML junk and format every timestamp for readability. You get professional, clean text — not a wall of code."
  },
  {
    title: "Zero Registration",
    description: "Paste the link, download the transcript. No signup, no email, no \"premium transcripts\" upsell. Works on any video with available captions."
  }
];

const howItWorks = [
  "Paste the YouTube URL — Any full-length video with captions or auto-generated transcripts.",
  "We extract the text — Captions, subtitles, or auto-generated transcripts, depending on what the video has.",
  "Download as a clean TXT file — Readable formatting with timestamps. Opens in any app."
];

const perfectFor = [
  {
    title: "Writers & Content Creators",
    description: "Turn 60-minute videos into blog posts, newsletters, or articles. Save hours of manual transcription. Quote creators with exact timestamps."
  },
  {
    title: "Researchers & Students",
    description: "Build searchable archives of lectures, interviews, and documentaries. Find specific concepts without rewatching entire videos."
  },
  {
    title: "Academics & Journalists",
    description: "Extract quotes with exact timestamps for citations. Verify claims against source material. Create reference libraries for fact-checking."
  },
  {
    title: "Podcasters & Audio Creators",
    description: "Convert YouTube interviews or panel discussions into episode scripts. Repurpose video transcripts into audio content or show notes."
  },
  {
    title: "Video Editors & Producers",
    description: "Use transcripts to identify and clip key moments without rewatching footage. Find the best soundbites for highlight reels, compilations, or Shorts."
  },
  {
    title: "Clippers & Highlight Creators",
    description: "Scan transcripts to find quotable moments, funny lines, or key takeaways. Build your clip list in minutes instead of rewatching an entire stream or podcast."
  },
  {
    title: "AI & Automation Users",
    description: "Feed clean transcripts into summarization tools, translation services, or AI analysis pipelines. Get structured plain text for any downstream process."
  },
  {
    title: "Language Learners & Translators",
    description: "Download transcripts in their original language, then run them through your preferred translation tool. Study native-speaker content systematically."
  },
  {
    title: "Legal & Compliance Teams",
    description: "Archive video statements, interviews, or depositions as timestamped text records. Create searchable documentation for compliance and review."
  },
  {
    title: "Accessibility Users",
    description: "Read content faster than watching. Essential for noisy environments, visual fatigue, or when you need to move through material quickly."
  }
];

const noticeText = {
  title: "What About Shorts?",
  text: "Transcript extraction is not available for YouTube Shorts. YouTube does not support captions or transcripts on Shorts.",
  linkText: "If you want audio/video from a Short, use our Shorts Downloader.",
  linkUrl: "/youtube-shorts-downloader"
};

const faqs = [
  {
    question: "Does this include auto-generated captions?",
    answer: "Yes. If YouTube has auto-generated or creator-uploaded captions available, we extract them."
  },
  {
    question: "What if a video has no captions?",
    answer: "We'll let you know. Some videos have neither captions nor transcripts — you can't extract what isn't there."
  },
  {
    question: "Are the timestamps accurate?",
    answer: "Yes. They match the video timeline exactly. Use them to jump to specific moments in your video player."
  },
  {
    question: "Can I get transcripts in other languages?",
    answer: "Yes. We export in whatever language the captions are in. Translate them afterward using any translation tool you prefer."
  },
  {
    question: "Do you edit the transcript content?",
    answer: "No. We clean up HTML entities (like &amp; → &) and format timestamps for readability. The words are exactly what the captions say."
  },
  {
    question: "Can I download transcripts from private videos?",
    answer: "Only if the video is publicly accessible on YouTube. Private videos can't be reached by our servers."
  },
  {
    question: "How do I use the timestamps?",
    answer: "Copy the transcript into your document or notes. Use Ctrl+F to search for keywords, then jump to that timestamp in your video player."
  },
  {
    question: "Why can't I get Shorts transcripts?",
    answer: "YouTube doesn't support captions or transcripts on Shorts. It's a platform limitation, not a tool limitation."
  }
];

const finalCta = {
  headline: "Skip the video. Get the text. Save hours.",
  buttonText: "Download Transcript Now"
};

export default function YouTubeTranscriptDownloaderPage() {
  return (
    <ToolLandingPageTemplate
      h1="Download YouTube transcripts in seconds. Read instead of watching."
      subheading="Extract captions, subtitles, or auto-generated text as clean, searchable files with timestamps. Works on full-length videos only — not Shorts."
      path="/youtube-transcript-downloader"
      faqs={faqs}
      reasons={reasons}
      howItWorks={howItWorks}
      perfectFor={perfectFor}
      noticeText={noticeText}
      transcriptExample={true}
      finalCta={finalCta}
      defaultFormat="transcript"
      transcriptOnly={true}
    />
  );
}
