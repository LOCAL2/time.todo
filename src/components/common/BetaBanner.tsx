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
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-xl shadow-2xl relative overflow-hidden max-w-md">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        
        <div className="relative flex items-center gap-3">
          <Sparkles className="w-5 h-5 flex-shrink-0 animate-pulse" />
          <p className="text-sm font-medium flex-1">
            เวอร์ชัน Beta - ฟีเจอร์บางอย่างอาจมีการเปลี่ยนแปลง
          </p>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
            aria-label="ปิด"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
