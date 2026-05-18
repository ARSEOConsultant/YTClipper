import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Video, Music, FileText, Download } from 'lucide-react';

const tools = [
  {
    title: 'YouTube to MP4',
    description: 'Download YouTube videos in high-quality MP4 format.',
    href: '/youtube-to-mp4',
    icon: Video,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
  },
  {
    title: 'YouTube to MP3',
    description: 'Extract audio from YouTube videos easily.',
    href: '/youtube-to-mp3',
    icon: Music,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
  },
  {
    title: 'Shorts Downloader',
    description: 'Save YouTube Shorts directly to your device.',
    href: '/youtube-shorts-downloader',
    icon: Download,
    color: 'text-purple-600',
    bg: 'bg-purple-100',
  },
  {
    title: 'Transcript Downloader',
    description: 'Get the text transcript of any YouTube video.',
    href: '/youtube-transcript-downloader',
    icon: FileText,
    color: 'text-amber-600',
    bg: 'bg-amber-100',
  },
];

export default function RelatedTools({ currentPath }: { currentPath?: string }) {
  const visibleTools = tools.filter(tool => tool.href !== currentPath);

  return (
    <section className="w-full bg-zinc-50 py-16 px-4 border-t border-zinc-100">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-2">More Tools</h2>
          <p className="text-zinc-500">Explore our other free utilities</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {visibleTools.slice(0, 3).map((tool) => (
            <Link key={tool.href} href={tool.href} className="block group">
              <Card className="p-6 h-full border-zinc-200 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${tool.bg} ${tool.color}`}>
                  <tool.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-zinc-900 group-hover:text-primary transition-colors">{tool.title}</h3>
                <p className="text-zinc-500 text-sm">{tool.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
