import { LucideIcon } from 'lucide-react';

interface HardwareSensorProps {
  icon: LucideIcon;
  label: string;
  value: string;
  status: 'online' | 'offline' | 'warning';
}

export function HardwareSensor({ icon: Icon, label, value, status }: HardwareSensorProps) {
  const statusColors = {
    online: 'bg-[#10B981]',
    offline: 'bg-[#EF4444]',
    warning: 'bg-[#F59E0B]',
  };

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="bg-[#0F172A] p-2 rounded-lg">
          <Icon className="text-[#94A3B8]" size={20} />
        </div>
        <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
      </div>
      <p className="text-[#94A3B8] text-sm mb-1">{label}</p>
      <p className="text-white">{value}</p>
    </div>
  );
}
