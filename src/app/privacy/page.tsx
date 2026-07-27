const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ufetchtube.com';

export const metadata = {
  title: 'Privacy Policy - UFetchTube',
  description: 'Privacy policy for UFetchTube.',
  alternates: { canonical: `${SITE_URL}/privacy` },
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-16 px-4 prose prose-zinc">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Privacy Policy</h1>
      
      <div className="space-y-6 text-zinc-600 leading-relaxed">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-xl font-semibold text-zinc-900">1. Information We Collect</h2>
        <p>UFetchTube does not require you to create an account. We do not collect or store personal identifying information. We may temporarily log IP addresses for rate limiting purposes to prevent abuse of our services.</p>

        <h2 className="text-xl font-semibold text-zinc-900">2. How We Use Information</h2>
        <p>The information we collect is used solely to provide and maintain the service, and to detect and prevent technical issues or abuse.</p>

        <h2 className="text-xl font-semibold text-zinc-900">3. Cookies</h2>
        <p>We do not use tracking cookies. We may use local storage to save your preferences (e.g., dark mode).</p>

        <h2 className="text-xl font-semibold text-zinc-900">4. Third-Party Services</h2>
        <p>Our service interacts with the YouTube API to fetch video metadata. Please refer to Google&apos;s Privacy Policy for information on how they handle data.</p>
      </div>
    </div>
  );
}
