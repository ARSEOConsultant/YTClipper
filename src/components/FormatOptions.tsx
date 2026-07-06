import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import { FormatOption } from '@/lib/services/youtubeService';
import { useState, useEffect } from 'react';

interface FormatOptionsProps {
  formats: FormatOption[];
  onDownloadMedia: (itag: number) => void;
  onDownloadTranscript: () => void;
  isLoading: boolean;
  hideTranscript?: boolean;
  transcriptOnly?: boolean;
}

export default function FormatOptions({ 
  formats, 
  onDownloadMedia, 
  onDownloadTranscript, 
  isLoading,
  hideTranscript = false,
  transcriptOnly = false
}: FormatOptionsProps) {
  const [selectedItag, setSelectedItag] = useState<number>(formats[0]?.itag || 0);

  // Update selected if formats change
  useEffect(() => {
    if (formats && formats.length > 0) {
      setSelectedItag(formats[0].itag);
    }
  }, [formats]);

  return (
    <div className={`w-full max-w-3xl mx-auto mt-6 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-100 flex flex-col sm:flex-row gap-4 bg-white/50 p-4 rounded-2xl border border-zinc-100 shadow-sm ${transcriptOnly ? 'justify-center' : ''}`}>
      
      {/* Media Download Section */}
      {!transcriptOnly && (
        <div className="flex-1 flex flex-col sm:flex-row gap-3 relative">
          <div className="relative flex-1">
            <select 
              className="w-full h-12 pl-4 pr-10 rounded-xl border border-zinc-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none font-medium text-zinc-700 disabled:opacity-50"
              value={selectedItag}
              onChange={(e) => setSelectedItag(Number(e.target.value))}
              disabled={isLoading || formats.length === 0}
            >
              {formats.map((f) => (
                <option key={f.itag} value={f.itag}>
                  {f.label}
                </option>
              ))}
              {formats.length === 0 && <option value={0}>No playable formats found</option>}
            </select>
            {/* Custom dropdown arrow */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
          
          <Button 
            className="h-12 px-8 rounded-xl font-semibold bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
            onClick={() => onDownloadMedia(selectedItag)}
            disabled={isLoading || formats.length === 0}
          >
            <Download className="w-5 h-5 mr-2" />
            Download
          </Button>
        </div>
      )}

      {/* Transcript Section */}
      {!hideTranscript && (
        <div className={transcriptOnly ? "w-full sm:w-auto" : "sm:w-auto"}>
          <Button
            variant="outline"
            className="w-full sm:w-auto h-12 px-8 rounded-xl text-zinc-600 hover:text-zinc-900 font-semibold border-zinc-200 hover:bg-zinc-50 transition-colors"
            onClick={onDownloadTranscript}
            disabled={isLoading}
          >
            <FileText className="w-5 h-5 mr-2 text-amber-500" />
            Get Transcript
          </Button>
        </div>
      )}
    </div>
  );
}
