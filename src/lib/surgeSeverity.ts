export type SurgeLevel = 'LOW' | 'MODERATE' | 'HIGH';

export function surgeSeverityStyles(level?: string | null) {
  switch (level) {
    case 'HIGH':
      return {
        text: 'text-[#EF4444]',
        bg: 'bg-[#EF4444]/12',
        border: 'border-[#EF4444]/45',
        bar: 'bg-[#EF4444]',
        dot: 'bg-[#EF4444]',
      };
    case 'MODERATE':
      return {
        text: 'text-[#F59E0B]',
        bg: 'bg-[#F59E0B]/12',
        border: 'border-[#F59E0B]/45',
        bar: 'bg-[#F59E0B]',
        dot: 'bg-[#F59E0B]',
      };
    default:
      return {
        text: 'text-[#10B981]',
        bg: 'bg-[#10B981]/12',
        border: 'border-[#10B981]/45',
        bar: 'bg-[#10B981]',
        dot: 'bg-[#10B981]',
      };
  }
}
