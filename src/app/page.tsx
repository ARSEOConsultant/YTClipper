import ToolLandingPageTemplate from '@/components/ToolLandingPageTemplate';

const reasons = [
  {
    title: "Instant Access",
    description: "No accounts, no apps, no BS. Paste a link and go."
  },
  {
    title: "Multiple Formats",
    description: "MP4 for video, MP3 for audio, TXT for transcripts. One tool, three options."
  },
  {
    title: "Works Everywhere",
    description: "Desktop, tablet, phone. Works on any browser."
  },
  {
    title: "Compliant by Default",
    description: "We remind you: only download what you own or have permission to use. Respect creators and copyright."
  },
  {
    title: "Free, Forever",
    description: "No premium tiers, no surprise limits, no hidden fees."
  }
];

const faqs = [
  {
    question: "Is this legal?",
    answer: "Yes. YTClipper only downloads videos you have permission to use. It's your responsibility to respect copyright and YouTube's Terms of Service. We support downloading your own content, licensed videos, and public domain material."
  },
  {
    question: "Why do I need an account?",
    answer: "You don't. Paste a URL, pick a format, and download. It's that simple. No signup, no login, no email required."
  },
  {
    question: "How fast is it?",
    answer: "Most downloads are ready in 10-30 seconds. If you're downloading high-quality video, it might take up to a minute. We'll show you the progress."
  },
  {
    question: "Will my download work?",
    answer: "If YouTube can play it, we can download it. The only exceptions are: videos with DRM protection (like some movies), private videos, and videos that require login."
  },
  {
    question: "What if the download fails?",
    answer: "We have built-in retry logic and clear error messages. If something goes wrong, we'll tell you exactly why. Most issues are with the video itself, not our tool."
  }
];

export default function Home() {
  return (
    <ToolLandingPageTemplate
      h1="Download YouTube Videos Instantly — No Account Needed"
      subheading="Download videos as MP4, extract audio as MP3, or grab transcripts. Works on any YouTube video. Takes 10 seconds."
      path="/"
      faqs={faqs}
      reasons={reasons}
    />
  );
}
