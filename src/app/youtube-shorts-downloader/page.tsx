import ToolLandingPageTemplate from '@/components/ToolLandingPageTemplate';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'YouTube Shorts Downloader | Save as MP4 or Extract MP3 Audio | No Watermarks',
  description: 'Download YouTube Shorts in full 1080p quality as MP4 or extract audio-only as MP3. No watermarks, no signup required.',
};

const chooseFormat = {
  headline: "Choose Your Download Type",
  items: [
    {
      name: "Full Video + Audio (MP4)",
      subtitle: "Complete video save",
      description: "Get the complete Short in up to 1080p HD. Original vertical format preserved. Perfect for repurposing, studying, or offline viewing."
    },
    {
      name: "Audio Only (MP3)",
      subtitle: "Instant sound extraction",
      description: "Extract just the audio from any Short. Smaller file. Instant download. Perfect for remixing, podcasting, or sound design."
    }
  ]
};

const reasons = [
  {
    title: "Vertical Format Preserved",
    description: "We save Shorts in their native 9:16 ratio. No black bars, no cropping. Ready for your phone, Instagram Reels, TikTok, or Snapchat."
  },
  {
    title: "Lossless Quality",
    description: "Up to 1080p HD without compression artifacts or watermarks. Unlike screen recorders that blur and lag your phone."
  },
  {
    title: "Video or Audio — You Decide",
    description: "Get the full video with audio, or strip it down to just the sound. Different tools for different creative needs."
  }
];

const howItWorks = [
  "Copy the Shorts URL — From desktop or mobile. Any YouTube Shorts link works.",
  "Choose your format — Full video MP4 or audio-only MP3.",
  "Download in seconds — MP4 straight to your camera roll. MP3 to your downloads folder."
];

const perfectFor = [
  {
    title: "Content Creators & Editors",
    description: "Clip highlights from trending Shorts for your own compilations. Study viral hooks and transitions frame-by-frame. Build a reference library of what works."
  },
  {
    title: "TikTok & Instagram Creators",
    description: "Download your own Shorts to repost across platforms without watermarks. Access trending audio before it disappears from your saved sounds."
  },
  {
    title: "Video Editors",
    description: "Extract audio from Shorts for use in client projects, YouTube videos, or podcast intros. Build a swipe file of production techniques and sounds you want to reference."
  },
  {
    title: "Podcasters & Audio Creators",
    description: "Download audio-only from Shorts containing trending clips, interviews, or spoken moments. Remix into podcast episodes or audiograms."
  },
  {
    title: "Social Media Managers & Marketers",
    description: "Archive high-performing Shorts for strategy reviews and creative briefings. Study competitor content. Build a swipe file of winning hooks and CTAs."
  },
  {
    title: "Growth Teams & Advertisers",
    description: "Download viral short-form ads to analyze structure, pacing, and copy. Use as creative references for your own paid campaigns."
  },
  {
    title: "Music & Sound Producers",
    description: "Extract audio from musical Shorts to study trends, production style, and arrangements. Build inspiration boards and reference playlists."
  },
  {
    title: "Digital Collectors",
    description: "Save your favorite Shorts offline. Build a personal curated collection without depending on YouTube's algorithm to surface them again."
  }
];

const noticeText = {
  title: "What About Transcripts for Shorts?",
  text: "Transcript extraction is not available for YouTube Shorts. Shorts don't support captions or transcripts.",
  linkText: "If you need text from a full-length YouTube video, use our Transcript Downloader.",
  linkUrl: "/youtube-transcript-downloader"
};

const faqs = [
  {
    question: "Can I download other creators' Shorts?",
    answer: "If it's your own content or you have permission, yes. Credit creators if you repost — respect the work."
  },
  {
    question: "Does the video have a watermark?",
    answer: "No. You get a clean, original-quality file with no marks or branding."
  },
  {
    question: "Which format should I choose?",
    answer: "MP4 if you want the full video for repurposing or offline viewing. MP3 if you only need the audio for remixing, podcasting, or sound design."
  },
  {
    question: "How large are the files?",
    answer: "MP4 Shorts (typically 15–60 seconds) are 5–20 MB. MP3 audio-only is usually 1–5 MB. Depends on the original Short's length."
  },
  {
    question: "Does this work on my phone?",
    answer: "Yes. Open this page in your phone's browser, paste the link, and save directly to your camera roll or downloads folder."
  },
  {
    question: "Can I repost these videos?",
    answer: "Only your own content or content you have explicit permission to repost. Don't claim others' work as yours."
  }
];

const finalCta = {
  headline: "Clip it, remix it, save it. No watermarks. No waiting.",
  buttonText: "Download Shorts Now"
};

export default function YouTubeShortsDownloaderPage() {
  return (
    <ToolLandingPageTemplate
      h1="Save YouTube Shorts as video or audio. Your choice. Your device."
      subheading="Download full-resolution vertical MP4 or extract audio-only as MP3. No watermarks. No quality loss."
      path="/youtube-shorts-downloader"
      faqs={faqs}
      reasons={reasons}
      howItWorks={howItWorks}
      perfectFor={perfectFor}
      chooseFormat={chooseFormat}
      noticeText={noticeText}
      finalCta={finalCta}
      defaultFormat="mp4"
      hideTranscript={true}
    />
  );
}
