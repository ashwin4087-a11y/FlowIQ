import { TrendingUp } from 'lucide-react';

interface SurgeBadgeProps {
  event: string;
  confidence: number;
}

export function SurgeBadge({ event, confidence }: SurgeBadgeProps) {
  return (
    <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-lg px-4 py-3 flex items-center gap-3">
      <TrendingUp className="text-[#F59E0B]" size={20} />
      <div>
        <p className="text-white text-sm">{event}</p>
        <p className="text-[#94A3B8] text-xs">{confidence}% confidence</p>
      </div>
    </div>
  );
}
