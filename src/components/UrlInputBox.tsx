'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ClipboardPaste, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface UrlInputBoxProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export default function UrlInputBox({ onSubmit, isLoading }: UrlInputBoxProps) {
  const [url, setUrl] = useState('');

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      toast.success('Pasted from clipboard');
    } catch (err) {
      toast.error('Failed to read clipboard');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      toast.error('Please enter a YouTube URL');
      return;
    }
    onSubmit(url.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto space-y-4">
      <div className="relative flex items-center shadow-lg rounded-full overflow-hidden border border-zinc-200 bg-white hover:border-zinc-300 transition-colors focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
        <div className="pl-6 pr-3 text-zinc-400">
          <Search className="w-5 h-5" />
        </div>
        <Input
          type="url"
          placeholder="Paste YouTube Video or Shorts URL here..."
          className="flex-1 border-0 focus-visible:ring-0 text-lg py-6 shadow-none rounded-none bg-transparent"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
        />
        <div className="flex items-center gap-2 pr-2">
          {url ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-zinc-700"
              onClick={() => setUrl('')}
              disabled={isLoading}
            >
              <span className="text-xl leading-none">&times;</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              className="text-zinc-500 hidden sm:flex items-center gap-2"
              onClick={handlePaste}
              disabled={isLoading}
            >
              <ClipboardPaste className="w-4 h-4" />
              Paste
            </Button>
          )}
          <Button
            type="submit"
            size="lg"
            className="rounded-full px-8 bg-black hover:bg-zinc-800 text-white font-medium text-base h-12"
            disabled={isLoading || !url}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Processing
              </>
            ) : (
              'Download'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
