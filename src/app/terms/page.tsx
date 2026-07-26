const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ytclipper.com';

export const metadata = {
  title: 'Terms of Service - YTClipper',
  description: 'Terms of Service for YTClipper.',
  alternates: { canonical: `${SITE_URL}/terms` },
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-16 px-4 prose prose-zinc">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Terms of Service</h1>
      
      <div className="space-y-6 text-zinc-600 leading-relaxed">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-xl font-semibold text-zinc-900">1. Acceptance of Terms</h2>
        <p>By accessing and using YTClipper, you accept and agree to be bound by the terms and provision of this agreement.</p>

        <h2 className="text-xl font-semibold text-zinc-900">2. Copyright and Usage Rights</h2>
        <p>YTClipper is a tool designed to help users process videos they own, have permission to use, or that are licensed for reuse. You agree not to use this service to download copyrighted material without permission. We do not support bypassing DRM or downloading protected content.</p>

        <h2 className="text-xl font-semibold text-zinc-900">3. Disclaimer of Warranties</h2>
        <p>The service is provided &quot;as is&quot; without any warranties, expressed or implied. We do not guarantee continuous, uninterrupted access to our tool.</p>

        <h2 className="text-xl font-semibold text-zinc-900">4. Limitation of Liability</h2>
        <p>In no event shall YTClipper be liable for any direct, indirect, incidental, special or consequential damages arising out of or in any way connected with the use of this service.</p>
      </div>
    </div>
  );
}
