import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import Link from 'next/link';
import { Plus_Jakarta_Sans } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'YouTube Downloader - Free MP4, MP3 & Transcript Extractor',
  description: 'Download YouTube videos as MP4, extract MP3 audio, or save transcripts instantly. Free, no account needed, no signup required. Works with any YouTube video.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jakarta.className}>
      <body className="min-h-screen flex flex-col bg-white text-zinc-900">
        <header className="sticky top-0 z-50 w-full border-b border-zinc-100 bg-white/80 backdrop-blur-md">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="font-bold text-xl tracking-tight text-primary flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-black">
                  YT
                </div>
                YTClipper
              </Link>
              <span className="hidden lg:inline text-xs font-normal text-zinc-400 border-l border-zinc-200 pl-3">
                Download what you own. Respect what you borrow.
              </span>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <Link href="/youtube-to-mp4" className="hover:text-primary transition-colors">MP4 Downloads</Link>
              <Link href="/youtube-to-mp3" className="hover:text-primary transition-colors">MP3 Audio</Link>
              <Link href="/youtube-shorts-downloader" className="hover:text-primary transition-colors">Shorts</Link>
              <Link href="/youtube-transcript-downloader" className="hover:text-primary transition-colors">Transcripts</Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>

        <footer className="border-t border-zinc-100 py-12 bg-zinc-50">
          <div className="container mx-auto px-4 max-w-5xl">
            {/* Trust Statement */}
            <div className="mb-8 pb-8 border-b border-zinc-200/60">
              <h4 className="font-semibold text-zinc-800 text-sm mb-4">YTClipper respects your privacy and creators' rights</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs text-zinc-500">
                <div>
                  <h5 className="font-bold text-zinc-700 mb-1">No signup.</h5>
                  <p>No email collection. No accounts.</p>
                </div>
                <div>
                  <h5 className="font-bold text-zinc-700 mb-1">No ads.</h5>
                  <p>No tracking. No data sales.</p>
                </div>
                <div>
                  <h5 className="font-bold text-zinc-700 mb-1">No waiting.</h5>
                  <p>Direct downloads. Instant playback.</p>
                </div>
                <div>
                  <h5 className="font-bold text-zinc-700 mb-1">Download responsibly.</h5>
                  <p>Only download content you own or have permission to use. Respect copyright and creator terms.</p>
                </div>
              </div>
            </div>
            
            {/* Footer Bottom Row */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-zinc-500">
              <div className="flex gap-4">
                <Link href="/how-to-use" className="hover:text-zinc-900">How to Use</Link>
                <Link href="/privacy" className="hover:text-zinc-900">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-zinc-900">Terms of Service</Link>
                <Link href="/contact" className="hover:text-zinc-900">Contact</Link>
              </div>
              <div>&copy; {new Date().getFullYear()} YTClipper. All rights reserved.</div>
            </div>
          </div>
        </footer>

        <Toaster />
      </body>
    </html>
  );
}
