import { Button } from '@/components/ui/button';
import { Video, Music, FileText, Download } from 'lucide-react';

interface FormatOptionsProps {
  onSelect: (format: 'mp4' | 'mp3' | 'transcript') => void;
  isLoading: boolean;
  activeFormat?: 'mp4' | 'mp3' | 'transcript' | null;
}

export default function FormatOptions({ onSelect, isLoading, activeFormat }: FormatOptionsProps) {
  return (
    <div className="w-full max-w-3xl mx-auto mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-100">
      <Button
        variant="outline"
        className={`h-auto py-4 flex flex-col items-center gap-2 rounded-xl transition-all ${activeFormat === 'mp4' ? 'ring-2 ring-primary border-primary bg-primary/5' : 'hover:border-primary/50'}`}
        onClick={() => onSelect('mp4')}
        disabled={isLoading}
      >
        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-1">
          <Video className="w-6 h-6" />
        </div>
        <div className="font-semibold text-base">Download MP4</div>
        <div className="text-xs text-zinc-500">HD Video Format</div>
      </Button>

      <Button
        variant="outline"
        className={`h-auto py-4 flex flex-col items-center gap-2 rounded-xl transition-all ${activeFormat === 'mp3' ? 'ring-2 ring-primary border-primary bg-primary/5' : 'hover:border-primary/50'}`}
        onClick={() => onSelect('mp3')}
        disabled={isLoading}
      >
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1">
          <Music className="w-6 h-6" />
        </div>
        <div className="font-semibold text-base">Extract MP3</div>
        <div className="text-xs text-zinc-500">High Quality Audio</div>
      </Button>

      <Button
        variant="outline"
        className={`h-auto py-4 flex flex-col items-center gap-2 rounded-xl transition-all ${activeFormat === 'transcript' ? 'ring-2 ring-primary border-primary bg-primary/5' : 'hover:border-primary/50'}`}
        onClick={() => onSelect('transcript')}
        disabled={isLoading}
      >
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-1">
          <FileText className="w-6 h-6" />
        </div>
        <div className="font-semibold text-base">Get Transcript</div>
        <div className="text-xs text-zinc-500">Text & Captions</div>
      </Button>
    </div>
  );
}
