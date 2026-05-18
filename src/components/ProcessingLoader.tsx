import { Loader2 } from 'lucide-react';

interface ProcessingLoaderProps {
  message: string;
}

export default function ProcessingLoader({ message }: ProcessingLoaderProps) {
  return (
    <div className="w-full max-w-3xl mx-auto mt-8 p-8 border border-zinc-100 bg-white/50 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center animate-in fade-in">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-zinc-100"></div>
        <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin absolute inset-0"></div>
        <div className="absolute inset-0 flex items-center justify-center text-primary">
          <Loader2 className="w-6 h-6 animate-pulse" />
        </div>
      </div>
      <h3 className="mt-4 font-medium text-lg text-zinc-900">{message}</h3>
      <p className="text-sm text-zinc-500 mt-1 text-center max-w-sm">
        This might take a few moments depending on the file size. Please don&apos;t close this page.
      </p>
    </div>
  );
}
