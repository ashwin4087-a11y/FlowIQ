import { useState } from 'react';
import { Zap } from 'lucide-react';

export function EmergencyButton() {
  const [isActive, setIsActive] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const handleActivate = () => {
    if (isActive) {
      setIsActive(false);
      setCountdown(null);
      return;
    }

    let count = 3;
    setCountdown(count);
    
    const interval = setInterval(() => {
      count--;
      if (count === 0) {
        clearInterval(interval);
        setIsActive(true);
        setCountdown(null);
      } else {
        setCountdown(count);
      }
    }, 1000);
  };

  return (
    <button
      onClick={handleActivate}
      className={`w-full py-6 rounded-xl text-lg transition-all ${
        isActive
          ? 'bg-[#10B981] text-[#0F172A] hover:bg-[#10B981]/90'
          : 'bg-[#EF4444] text-white hover:bg-[#EF4444]/90'
      } ${countdown ? 'animate-pulse' : ''}`}
    >
      <div className="flex flex-col items-center gap-2">
        <Zap size={32} fill="currentColor" />
        {countdown ? (
          <span>Activating in {countdown}...</span>
        ) : isActive ? (
          <span>Green Wave Active</span>
        ) : (
          <span>Activate Green Wave</span>
        )}
      </div>
    </button>
  );
}
