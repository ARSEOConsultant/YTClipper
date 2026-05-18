import { Card } from '@/components/ui/card';
import { VideoMetadata } from '@/lib/services/youtubeService';
import { Clock, User } from 'lucide-react';
import Image from 'next/image';

interface VideoPreviewCardProps {
  metadata: VideoMetadata;
}

export default function VideoPreviewCard({ metadata }: VideoPreviewCardProps) {
  return (
    <Card className="w-full max-w-3xl mx-auto overflow-hidden bg-white/50 backdrop-blur-sm border-zinc-100 shadow-xl shadow-zinc-200/40 rounded-2xl transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col sm:flex-row">
        <div className="relative w-full sm:w-64 aspect-video sm:aspect-auto sm:h-full bg-zinc-100 flex-shrink-0">
          {metadata.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={metadata.thumbnailUrl}
              alt={metadata.title}
              className="object-cover w-full h-full absolute inset-0"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-400">
              No Thumbnail
            </div>
          )}
          <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md text-white text-xs px-2 py-1 rounded font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {metadata.duration}
          </div>
          {metadata.type === 'shorts' && (
            <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded font-bold uppercase tracking-wide">
              Shorts
            </div>
          )}
        </div>
        
        <div className="p-6 flex flex-col justify-center flex-1">
          <h3 className="font-semibold text-lg line-clamp-2 leading-tight text-zinc-900 mb-2">
            {metadata.title}
          </h3>
          <div className="flex items-center text-zinc-500 text-sm mb-4">
            <User className="w-4 h-4 mr-1.5" />
            <span className="truncate">{metadata.channelTitle}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
