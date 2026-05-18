import { ShieldAlert } from 'lucide-react';

interface ComplianceNoticeProps {
  notice: string;
}

export default function ComplianceNotice({ notice }: ComplianceNoticeProps) {
  return (
    <div className="max-w-2xl mx-auto mt-6 flex items-start gap-3 p-4 bg-zinc-50 rounded-xl text-xs sm:text-sm text-zinc-500 border border-zinc-100">
      <ShieldAlert className="w-5 h-5 flex-shrink-0 text-zinc-400 mt-0.5" />
      <p className="leading-relaxed">
        <strong>Terms of Service & Copyright:</strong> {notice}
      </p>
    </div>
  );
}
