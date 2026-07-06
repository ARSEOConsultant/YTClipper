'use client';

import { useState } from 'react';
import Link from 'next/link';
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

interface ChoiceFormatItem {
  name: string;
  subtitle: string;
  description: string;
}

interface ToolLandingPageTemplateProps {
  h1: string;
  subheading: string;
  path: string;
  faqs: { question: string; answer: string }[];
  defaultFormat?: 'mp4' | 'mp3' | 'transcript';
  hideFormatSelection?: boolean;
  audioOnly?: boolean;
  videoOnly?: boolean;
  hideTranscript?: boolean;
  transcriptOnly?: boolean;
  reasons?: { title: string; description: string }[];
  // NEW props for finalized copy layout sections
  howItWorks?: string[];
  perfectFor?: { title: string; description: string }[];
  comparison?: {
    headline: string;
    items: { competitor: string; solutions: string }[];
    footerText: string;
  };
  chooseFormat?: {
    headline: string;
    items: ChoiceFormatItem[];
  };
  formatTable?: {
    headers: string[];
    rows: string[][];
  };
  noticeText?: {
    title: string;
    text: string;
    linkUrl?: string;
    linkText?: string;
  };
  transcriptExample?: boolean;
  finalCta?: {
    headline: string;
    buttonText: string;
  };
}

export default function ToolLandingPageTemplate({
  h1,
  subheading,
  path,
  faqs,
  defaultFormat,
  hideFormatSelection = false,
  audioOnly = false,
  videoOnly = false,
  hideTranscript = false,
  transcriptOnly = false,
  reasons,
  howItWorks,
  perfectFor,
  comparison,
  chooseFormat,
  formatTable,
  noticeText,
  transcriptExample,
  finalCta,
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
        if (defaultFormat === 'transcript') {
          handleTranscriptDownload(submittedUrl);
        } else if (metaData.availableFormats && metaData.availableFormats.length > 0) {
          // Find first matching format type if possible
          const match = metaData.availableFormats.find((f: any) => 
            defaultFormat === 'mp3' ? f.type === 'audio' : f.type === 'video'
          );
          handleMediaDownload(match ? match.itag : metaData.availableFormats[0].itag, submittedUrl);
        }
      }
      
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const handleMediaDownload = async (itag: number, targetUrl: string = url) => {
    setIsProcessing(true);
    setProcessingMessage('Starting download process...');

    try {
      const res = await fetch(`/api/job/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, itag }),
      });

      if (!res.ok) throw new Error((await res.json()).error || 'Processing failed');
      const data = await res.json();

      if (!data.requiresJob) {
        // Direct download
        const a = document.createElement('a');
        a.href = data.downloadUrl;
        a.download = data.filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success('Download started');
        setIsProcessing(false);
        return;
      }

      // Needs Job Processing - Start Polling
      setProcessingMessage('Processing High-Quality Video (This may take a minute)...');
      const jobId = data.jobId;
      
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/job/status?jobId=${jobId}`);
          if (!statusRes.ok) throw new Error('Failed to check status');
          
          const statusData = await statusRes.json();
          
          if (statusData.status === 'completed') {
            clearInterval(pollInterval);
            
            // Trigger final download
            const a = document.createElement('a');
            a.href = `/api/download/file?jobId=${jobId}`;
            a.download = statusData.filename;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            toast.success('Processing complete! Download starting.');
            setIsProcessing(false);
          } else if (statusData.status === 'error') {
            clearInterval(pollInterval);
            toast.error(statusData.error || 'Processing failed.');
            setIsProcessing(false);
          }
        } catch (pollErr) {
          console.error(pollErr);
        }
      }, 2000);

    } catch (err: any) {
      toast.error(err.message || 'An error occurred during processing');
      setIsProcessing(false);
    }
  };

  const handleTranscriptDownload = async (targetUrl: string = url) => {
    setIsProcessing(true);
    setProcessingMessage('Extracting captions...');

    try {
      const res = await fetch(`/api/transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });

      if (!res.ok) throw new Error((await res.json()).error || 'Processing failed');
      const data = await res.json();

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
      
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during processing');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div id="downloader-section" className="min-h-screen bg-white flex flex-col">
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
                      formats={
                        audioOnly
                          ? metadata.availableFormats.filter(f => f.type === 'audio')
                          : videoOnly
                            ? metadata.availableFormats.filter(f => f.type === 'video')
                            : metadata.availableFormats
                      }
                      onDownloadMedia={(itag) => handleMediaDownload(itag, url)} 
                      onDownloadTranscript={() => handleTranscriptDownload(url)}
                      isLoading={isProcessing} 
                      hideTranscript={hideTranscript}
                      transcriptOnly={transcriptOnly}
                    />
                  )
                )}
              </div>
            )}
          </div>
        </section>

        {/* Choose Format Grid Section (MP3 / Shorts page) */}
        {chooseFormat && (
          <section className="py-16 px-4 border-t border-zinc-100 bg-white">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-zinc-900 mb-12 text-center">{chooseFormat.headline}</h2>
              <div 
                className="grid gap-6" 
                style={{ 
                  gridTemplateColumns: chooseFormat.items.length === 2 
                    ? 'repeat(auto-fit, minmax(280px, 1fr))' 
                    : 'repeat(auto-fit, minmax(240px, 1fr))' 
                }}
              >
                {chooseFormat.items.map((item, idx) => (
                  <div key={idx} className="bg-zinc-50 rounded-xl p-6 border border-zinc-200/60 shadow-sm hover:shadow-md transition-all duration-300">
                    <h3 className="font-bold text-lg text-zinc-900 mb-1">{item.name}</h3>
                    <span className="text-xs text-primary font-medium tracking-wide uppercase">{item.subtitle}</span>
                    <p className="text-zinc-600 text-sm mt-3 leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Why Choose YTClipper Section */}
        {reasons && (
          <section className="py-16 px-4 bg-zinc-50 border-t border-zinc-100">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-12 text-center">
                Why Choose YTClipper
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                {reasons.map((reason, index) => (
                  <div key={index} className="bg-white rounded-lg p-6 border border-zinc-200">
                    <h3 className="text-lg font-semibold text-zinc-900 mb-3">
                      {reason.title}
                    </h3>
                    <p className="text-zinc-600 text-sm leading-relaxed">
                      {reason.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* How It Works Section */}
        {howItWorks && (
          <section className="py-16 px-4 border-t border-zinc-100 bg-white">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-zinc-900 mb-12 text-center">How It Works</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {howItWorks.map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-primary/5 text-primary font-bold flex items-center justify-center text-lg mb-4 border border-primary/10">
                      {idx + 1}
                    </div>
                    <p className="text-zinc-700 text-sm leading-relaxed max-w-xs">{step}</p>
                  </div>
                ))}
              </div>
              {path === '/' && (
                <p className="text-zinc-400 text-xs mt-8 italic">*Typical download: under 2 minutes for a standard-length video.</p>
              )}
              {path === '/youtube-to-mp4' && (
                <p className="text-zinc-400 text-xs mt-8 italic">*Typical download time: under 2 minutes for a 10-minute video at 1080p on standard broadband.</p>
              )}
              {path === '/youtube-to-mp3' && (
                <p className="text-zinc-400 text-xs mt-8 italic">*Typical conversion time: under 30 seconds.</p>
              )}
              {path === '/youtube-shorts-downloader' && (
                <p className="text-zinc-400 text-xs mt-8 italic">*Average download time: under 5 seconds.</p>
              )}
              {path === '/youtube-transcript-downloader' && (
                <p className="text-zinc-400 text-xs mt-8 italic">*Typical extraction time: under 10 seconds.</p>
              )}
            </div>
          </section>
        )}

        {/* Transcript example output mockup */}
        {transcriptExample && (
          <section className="py-12 px-4 bg-zinc-50 border-t border-zinc-100">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-zinc-900 mb-4 text-center">Example transcript output format</h3>
              <div className="bg-zinc-900 rounded-xl p-6 shadow-inner font-mono text-xs sm:text-sm text-zinc-300 border border-zinc-800">
                <p className="mb-2 text-zinc-500">{"// transcript_video.txt"}</p>
                <p><span className="text-amber-500">[02:35]</span> Here&apos;s the key insight about the topic</p>
                <p><span className="text-amber-500">[02:47]</span> And here&apos;s why it matters for your work</p>
                <p><span className="text-amber-500">[03:01]</span> This is the part most people skip over</p>
              </div>
            </div>
          </section>
        )}

        {/* Format comparison table */}
        {formatTable && (
          <section className="py-16 px-4 border-t border-zinc-100 bg-zinc-50/50">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-zinc-900 mb-8 text-center">When to Use Each Format</h2>
              <div className="overflow-x-auto rounded-xl border border-zinc-200/80 shadow-sm">
                <table className="w-full text-left border-collapse bg-white">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-sm font-semibold text-zinc-700">
                      {formatTable.headers.map((h, i) => (
                        <th key={i} className="px-6 py-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 text-sm text-zinc-600">
                    {formatTable.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-zinc-50/50 transition-colors">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-6 py-4 font-normal">
                            {cIdx === 0 ? <strong className="text-zinc-900 font-semibold">{cell}</strong> : cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Perfect For Section */}
        {perfectFor && (
          <section className="py-16 px-4 border-t border-zinc-100 bg-zinc-50/30">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-zinc-900 mb-12 text-center">Perfect For</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {perfectFor.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-6 border border-zinc-200/60 shadow-sm">
                    <h3 className="font-bold text-base text-zinc-900 mb-2">{item.title}</h3>
                    <p className="text-zinc-600 text-sm leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Why Your Current Method Isn't Working comparison */}
        {comparison && (
          <section className="py-16 px-4 border-t border-zinc-100 bg-white">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-zinc-900 mb-4 text-center">{comparison.headline}</h2>
              <div className="grid md:grid-cols-3 gap-8 mt-12">
                {comparison.items.map((item, idx) => (
                  <div key={idx} className="bg-red-50/30 border border-red-100 rounded-xl p-6">
                    <h3 className="font-bold text-base text-red-950 mb-2 flex items-center gap-2">
                      <span className="text-red-500 font-extrabold">✕</span> {item.competitor}
                    </h3>
                    <p className="text-zinc-600 text-sm leading-relaxed">{item.solutions}</p>
                  </div>
                ))}
              </div>
              <div className="mt-10 p-6 bg-primary/5 rounded-xl border border-primary/10 text-center max-w-2xl mx-auto">
                <p className="text-zinc-800 text-sm font-medium">{comparison.footerText}</p>
              </div>
            </div>
          </section>
        )}

        {/* Shorts / Caption disclaimers */}
        {noticeText && (
          <section className="py-10 px-4 border-t border-zinc-100 bg-amber-50/20">
            <div className="max-w-2xl mx-auto text-center p-6 bg-amber-50 border border-amber-200/60 rounded-xl">
              <h3 className="text-amber-900 font-bold mb-2 text-base">{noticeText.title}</h3>
              <p className="text-amber-800 text-sm mb-4 leading-relaxed">{noticeText.text}</p>
              {noticeText.linkUrl && noticeText.linkText && (
                <Link href={noticeText.linkUrl} className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1">
                  {noticeText.linkText} &rarr;
                </Link>
              )}
            </div>
          </section>
        )}

        {/* FAQs Section */}
        <FAQSection faqs={faqs} />

        {/* Related Tools Section */}
        <RelatedTools currentPath={path} showAll={path === '/'} />

        {/* Final CTA block */}
        {finalCta && (
          <section className="py-20 px-4 bg-zinc-950 text-white border-t border-zinc-900 text-center">
            <div className="max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl font-bold tracking-tight">{finalCta.headline}</h2>
              <button
                onClick={() => {
                  document.getElementById('downloader-section')?.scrollIntoView({ behavior: 'smooth' });
                  document.querySelector('input')?.focus();
                }}
                className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-white text-zinc-950 font-bold hover:bg-zinc-100 transition-colors shadow-lg shadow-black/10 cursor-pointer"
              >
                {finalCta.buttonText}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
