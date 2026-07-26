const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ytclipper.com';

export const metadata = {
  title: 'Contact Us - YTClipper',
  description: 'Get in touch with the YTClipper team.',
  alternates: { canonical: `${SITE_URL}/contact` },
};

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto py-16 px-4 prose prose-zinc">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Contact Us</h1>
      
      <div className="space-y-6 text-zinc-600 leading-relaxed">
        <p>If you have any questions, concerns, or wish to report abuse, please reach out to us.</p>
        
        <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-100">
          <h2 className="text-xl font-semibold text-zinc-900 mb-2 mt-0">Email Us</h2>
          <p className="mb-0">You can contact our support team at: <br/>
            <a href="mailto:support@ytclipper.example.com" className="text-primary font-medium hover:underline">
              support@ytclipper.example.com
            </a>
          </p>
        </div>

        <p className="text-sm text-zinc-500">
          Please note that we may take up to 48 hours to respond to inquiries. For copyright infringement claims, please use the subject line &quot;DMCA Takedown Request&quot;.
        </p>
      </div>
    </div>
  );
}
