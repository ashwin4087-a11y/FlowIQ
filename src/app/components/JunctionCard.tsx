interface JunctionCardProps {
  name: string;
  vehicleCount: number;
  status: 'normal' | 'warning' | 'critical';
  onClick?: () => void;
}

export function JunctionCard({ name, vehicleCount, status, onClick }: JunctionCardProps) {
  const statusColors = {
    normal: 'bg-[#10B981]',
    warning: 'bg-[#F59E0B]',
    critical: 'bg-[#EF4444]',
  };

  const borderColors = {
    normal: 'border-[#334155] hover:border-[#10B981]/50',
    warning: 'border-[#F59E0B]/30 hover:border-[#F59E0B]',
    critical: 'border-[#EF4444]/30 hover:border-[#EF4444]',
  };

  return (
    <button
      onClick={onClick}
      className={`bg-[#1E293B] border ${borderColors[status]} rounded-lg p-4 text-left transition-all hover:bg-[#263347] w-full`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
        <span className="text-[#94A3B8] text-xs uppercase tracking-wide">{status}</span>
      </div>
      <h4 className="text-white mb-2 text-sm">{name}</h4>
      <div className="flex items-center justify-between">
        <span className="text-2xl">{vehicleCount}</span>
        <span className="text-[#94A3B8] text-xs">vehicles</span>
      </div>
    </button>
  );
}
