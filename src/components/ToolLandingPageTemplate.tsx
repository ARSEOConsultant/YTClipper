'use client';

import { useState } from 'react';
import UrlInputBox from '@/components/UrlInputBox';
import VideoPreviewCard from '@/components/VideoPreviewCard';
import FormatOptions from '@/components/FormatOptions';
import ProcessingLoader from '@/components/ProcessingLoader';
import ComplianceNotice from '@/components/ComplianceNotice';
import FAQSection from '@/components/FAQSection';
import RelatedTools from '@/components/RelatedTools';
import { getComplianceNotice } from '@/lib/services/complianceService';
import { VideoMetadata } from '@/lib/services/youtubeService';
import { toast } from 'sonner';

interface ToolLandingPageTemplateProps {
  h1: string;
  subheading: string;
  path: string;
  faqs: { question: string; answer: string }[];
  defaultFormat?: 'mp4' | 'mp3' | 'transcript';
  hideFormatSelection?: boolean;
}

export default function ToolLandingPageTemplate({
  h1,
  subheading,
  path,
  faqs,
  defaultFormat,
  hideFormatSelection = false,
}: ToolLandingPageTemplateProps) {
  const [url, setUrl] = useState('');
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');

  const handleUrlSubmit = async (submittedUrl: string) => {
    setUrl(submittedUrl);
    setMetadata(null);
    setIsLoadingMetadata(true);

    try {
      // Validate
      const valRes = await fetch('/api/validate-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: submittedUrl }),
      });
      if (!valRes.ok) throw new Error((await valRes.json()).error || 'Invalid URL');

      // Fetch Metadata
      const metaRes = await fetch('/api/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: submittedUrl }),
      });
      if (!metaRes.ok) throw new Error((await metaRes.json()).error || 'Failed to fetch metadata');
      
      const metaData = await metaRes.json();
      setMetadata(metaData);
      
      // If default format exists and format selection is hidden, process immediately
      if (defaultFormat && hideFormatSelection) {
        handleFormatSelect(defaultFormat, submittedUrl);
      }
      
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const handleFormatSelect = async (format: 'mp4' | 'mp3' | 'transcript', targetUrl: string = url) => {
    setIsProcessing(true);
    setProcessingMessage(`Preparing your ${format.toUpperCase()}...`);

    try {
      const res = await fetch(`/api/${format === 'transcript' ? 'transcript' : `download/${format}`}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, quality: '1080p' }),
      });

      if (!res.ok) throw new Error((await res.json()).error || 'Processing failed');
      const data = await res.json();

      if (format === 'transcript') {
        // Handle text download
        const blob = new Blob([data.text], { type: 'text/plain;charset=utf-8' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `transcript_${targetUrl.split('v=')[1] || 'video'}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        toast.success('Transcript downloaded successfully');
      } else {
        // Handle media download (mock URL)
        const a = document.createElement('a');
        a.href = data.downloadUrl;
        a.download = data.filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success(`${format.toUpperCase()} download started`);
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during processing');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-20 pb-32 px-4 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-white -z-10" />
          <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-blue-100/40 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-purple-100/40 rounded-full blur-3xl -z-10 transform -translate-x-1/2 translate-y-1/2" />

          <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-zinc-900 leading-tight">
              {h1}
            </h1>
            <p className="text-lg md:text-xl text-zinc-600 max-w-2xl mx-auto leading-relaxed">
              {subheading}
            </p>

            <div className="mt-12">
              <UrlInputBox onSubmit={handleUrlSubmit} isLoading={isLoadingMetadata} />
              <ComplianceNotice notice={getComplianceNotice()} />
            </div>

            {/* Results Area */}
            {metadata && !isLoadingMetadata && (
              <div className="mt-12 space-y-8">
                <VideoPreviewCard metadata={metadata} />
                
                {isProcessing ? (
                  <ProcessingLoader message={processingMessage} />
                ) : (
                  !hideFormatSelection && (
                    <FormatOptions 
                      onSelect={(fmt) => handleFormatSelect(fmt, url)} 
                      isLoading={isProcessing} 
                    />
                  )
                )}
              </div>
            )}
          </div>
        </section>

        {/* Content Sections */}
        <FAQSection faqs={faqs} />
        <RelatedTools currentPath={path} />
      </main>
    </div>
  );
}
