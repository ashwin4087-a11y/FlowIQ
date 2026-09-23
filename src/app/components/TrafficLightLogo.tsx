export function TrafficLightLogo({ size = 28 }: { size?: number }) {
  const circleRadius = size * 0.18;
  const housingWidth = size * 0.55;
  const housingHeight = size * 1.3;

  return (
    <svg width={size} height={housingHeight} viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="5" width="36" height="70" rx="12" fill="#111827" stroke="#0F172A" strokeWidth="2" />
      <circle cx="30" cy="20" r="10" fill="#EF4444" />
      <circle cx="30" cy="40" r="10" fill="#F59E0B" />
      <circle cx="30" cy="60" r="10" fill="#22C55E" />
      <rect x="26" y="76" width="8" height="8" rx="2" fill="#111827" />
    </svg>
  );
}
