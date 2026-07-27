import ToolLandingPageTemplate from '@/components/ToolLandingPageTemplate';
import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ufetchtube.com';

export const metadata: Metadata = {
  title: 'YouTube to MP3 Converter | MP3, M4A, WebM Audio Download | Free, No Signup',
  description: 'Convert YouTube videos to MP3, M4A, or WebM audio. Free instant downloads. No login required. Works on any device.',
  alternates: { canonical: `${SITE_URL}/youtube-to-mp3` },
};

const chooseFormat = {
  headline: "Choose Your Format",
  items: [
    {
      name: "MP3 — Universal",
      subtitle: "General use",
      description: "Works on every phone, car stereo, and music player. Best for podcasts, lectures, and music. If you're unsure, choose this."
    },
    {
      name: "M4A — Apple Optimized",
      subtitle: "Apple-first",
      description: "Cleaner compression than MP3. Better sound quality at smaller file sizes. Native on iPhone, Mac, and iTunes libraries."
    },
    {
      name: "WebM — Modern & Compact",
      subtitle: "Modern browsers/apps",
      description: "Excellent compression with minimal quality loss. Smallest file size. Best for web projects, streaming tools, or developers."
    }
  ]
};

const reasons = [
  {
    title: "Format Freedom",
    description: "Most tools give you MP3 or nothing. We give you three formats so you get the file your device actually wants."
  },
  {
    title: "High-Quality Audio",
    description: "128kbps stereo, 44.1kHz sampling rate. Crystal-clear for spoken content. Solid for music. No tinny, over-compressed files."
  },
  {
    title: "Private by Default",
    description: "No login. No ads. No \"upgrade for better quality\" paywall. Download what you want, in the format you want, and leave."
  }
];

const howItWorks = [
  "Paste the YouTube link — Video, playlist item, podcast, music — any URL works.",
  "Choose your format — MP3, M4A, or WebM.",
  "Download and enjoy — File lands on your device. Temp files deleted from our server after 15 minutes."
];

const perfectFor = [
  {
    title: "Students & Learners",
    description: "Download lectures and educational videos as audio. Study without video distraction. Listen offline during commutes or while exercising."
  },
  {
    title: "Podcasters & Content Creators",
    description: "Extract audio clips from YouTube videos to use in podcast episodes or social content. Only use content you own or have permission to use."
  },
  {
    title: "Commuters",
    description: "Convert long video content into audio. Save mobile data. Save battery. Listen during your commute without staring at a screen."
  },
  {
    title: "Musicians & Producers",
    description: "Study chord progressions, production techniques, and arrangements from YouTube tutorials. Download and analyze offline in your DAW."
  },
  {
    title: "TikTok & Social Creators",
    description: "Extract trending audio from YouTube to remix into your own content. Don't let trending sounds disappear before you can use them."
  },
  {
    title: "Language Learners",
    description: "Download conversations and lessons in native speech. Listen repeatedly to train your ear. Pair with our Transcript Downloader for reading practice."
  },
  {
    title: "Content Repurposers",
    description: "Turn video content into podcast episodes, audiogram clips, or voice-over material. Download once, use across multiple platforms."
  }
];

const formatTable = {
  headers: ["Format", "File Size", "Compatibility", "Best For"],
  rows: [
    ["MP3", "Medium", "Every device", "General use, car stereos, music players"],
    ["M4A", "Smaller", "Apple-first", "iPhone, Mac, iTunes libraries"],
    ["WebM", "Smallest", "Modern browsers/apps", "Web projects, developers, streaming tools"]
  ]
};

const faqs = [
  {
    question: "Which format should I pick?",
    answer: "MP3 if unsure — it plays everywhere. M4A for Apple devices. WebM for web projects or when file size matters."
  },
  {
    question: "How good is the audio quality?",
    answer: "128kbps is broadcast-quality for spoken content. Solid for music listening. If you need lossless audio for professional production, you'll need a dedicated music store."
  },
  {
    question: "Can I use this for copyrighted music?",
    answer: "Only if you own the video or have explicit permission from the copyright holder. We remind you at download — respect creators."
  },
  {
    question: "Why is M4A smaller than MP3?",
    answer: "M4A uses more efficient compression algorithms. Same perceived quality, smaller file. Apple devices handle M4A natively."
  },
  {
    question: "Do you keep my converted files?",
    answer: "No. Converted audio is deleted from our servers after 15 minutes. Your download is direct and private."
  },
  {
    question: "Will you email me my file?",
    answer: "No. We don't collect emails. Download happens directly in your browser."
  }
];

const finalCta = {
  headline: "Audio you want. Format you need. Downloaded.",
  buttonText: "Extract Audio Now"
};

export default function YouTubeToMp3Page() {
  return (
    <ToolLandingPageTemplate
      h1="Extract audio from YouTube videos"
      subheading="Turn your favorite YouTube clips into high-quality MP3, M4A, or WebM audio files in seconds, pick what works for your device. Perfect for building your offline music library or saving podcasts on the go."
      path="/youtube-to-mp3"
      faqs={faqs}
      reasons={reasons}
      howItWorks={howItWorks}
      perfectFor={perfectFor}
      chooseFormat={chooseFormat}
      formatTable={formatTable}
      finalCta={finalCta}
      defaultFormat="mp3"
      audioOnly={true}
      hideTranscript={true}
    />
  );
}
