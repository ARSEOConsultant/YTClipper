import ToolLandingPageTemplate from '@/components/ToolLandingPageTemplate';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'YouTube to MP4 Downloader | Fast, Free Video Downloads, No Signup',
  description: 'Download YouTube videos as MP4 instantly. No login, no ads, no waiting on processing. Works on any device.',
};

const reasons = [
  {
    title: "Instant, Not Processed",
    description: "Your MP4 is already a complete file on YouTube's own servers — we don't rebuild or re-encode it. That means no waiting, no failed merges, no timeouts."
  },
  {
    title: "Works Every Time",
    description: "No dependency on merging separate video and audio streams — the single most common point of failure for downloader tools. Fewer moving parts, fewer things to break."
  },
  {
    title: "Instant Playback",
    description: "The file starts playing the moment the download begins — no waiting for the full file."
  }
];

const howItWorks = [
  "Paste your YouTube URL — Any public video works.",
  "Click Download — We resolve the direct file link.",
  "Download starts immediately — No processing, no queue, no waiting."
];

const perfectFor = [
  {
    title: "Students & Educators",
    description: "Download lectures, tutorials, and documentaries for offline study or classroom use. Stop depending on school WiFi to run a lesson."
  },
  {
    title: "Content Creators",
    description: "Back up your own uploaded videos. Reference footage without streaming lag."
  },
  {
    title: "Travelers",
    description: "Fill your device before boarding. Watch offline during flights, long train rides, or travel with no reliable connection."
  },
  {
    title: "Video Editors",
    description: "Source royalty-free footage from public domain YouTube channels for quick reference or rough cuts."
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
    question: "Why only 360p?",
    answer: "360p is YouTube's standard pre-packaged format — video and audio already combined into one file. Higher resolutions require merging separate video-only and audio-only streams on the fly, which is slower and far more likely to fail. We chose reliability over resolution."
  },
  {
    question: "How long does downloading take?",
    answer: "Downloads start immediately — no processing or merging step. Most files begin downloading in under a second."
  },
  {
    question: "Do you store my videos?",
    answer: "No. We resolve the download link on request and don't keep copies."
  },
  {
    question: "Can I download playlists?",
    answer: "Currently we support single video downloads. Paste one URL at a time."
  },
  {
    question: "Is this legal?",
    answer: "Yes, if you own the content or have permission. We display a compliance reminder at download — please respect creators' rights."
  }
];

const finalCta = {
  headline: "Fast, reliable MP4 downloads. Your device.",
  buttonText: "Download My Video"
};

export default function YouTubeToMp4Page() {
  return (
    <ToolLandingPageTemplate
      h1="Download YouTube videos as MP4. Fast, free, no signup."
      subheading="No merging, no processing delays. Paste a link and your file is ready in seconds."
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
