import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { appConfig, isBeta } from '../../config/app';

export function BetaBanner() {
  const [isVisible, setIsVisible] = useState(() => {
    const dismissed = localStorage.getItem('betaBannerDismissed');
    return !dismissed;
  });

  if (!isBeta() || !appConfig.showBetaBadge || !isVisible) return null;

  const handleDismiss = () => {
    localStorage.setItem('betaBannerDismissed', 'true');
    setIsVisible(false);
  };

  return (
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 md:py-3 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      
      <div className="relative flex items-center justify-between gap-3 max-w-7xl mx-auto">
        <div className="flex items-center justify-center gap-2 md:gap-3 flex-1">
          <Sparkles className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0 animate-pulse" />
          <p className="text-xs md:text-sm font-medium">
            เวอร์ชัน Beta - ฟีเจอร์บางอย่างอาจมีการเปลี่ยนแปลง
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
          aria-label="ปิด"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
