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
            <Link href="/" className="font-bold text-xl tracking-tight text-primary flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-black">
                YT
              </div>
              YTClipper
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600">
              <Link href="/youtube-to-mp3" className="hover:text-primary transition-colors">MP3</Link>
              <Link href="/youtube-shorts-downloader" className="hover:text-primary transition-colors">Shorts</Link>
              <Link href="/youtube-transcript-downloader" className="hover:text-primary transition-colors">Transcript</Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>

        <footer className="border-t border-zinc-100 py-8 bg-zinc-50">
          <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-zinc-500">
            <div className="flex gap-4">
              <Link href="/how-to-use" className="hover:text-zinc-900">How to Use</Link>
              <Link href="/privacy" className="hover:text-zinc-900">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-zinc-900">Terms of Service</Link>
              <Link href="/contact" className="hover:text-zinc-900">Contact</Link>
            </div>
            <div>&copy; {new Date().getFullYear()} YTClipper. All rights reserved.</div>
          </div>
        </footer>

        <Toaster />
      </body>
    </html>
  );
}
