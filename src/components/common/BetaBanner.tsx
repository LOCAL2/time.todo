import { Sparkles } from 'lucide-react';
import { appConfig, isBeta } from '../../config/app';

export function BetaBanner() {
  if (!isBeta() || !appConfig.showBetaBadge) return null;

  return (
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 md:py-3 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      
      <div className="relative flex items-center justify-center gap-2 md:gap-3 max-w-7xl mx-auto">
        <Sparkles className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0 animate-pulse" />
        <p className="text-xs md:text-sm font-medium">
          เวอร์ชัน Beta - ฟีเจอร์บางอย่างอาจมีการเปลี่ยนแปลง
        </p>
      </div>
    </div>
  );
}
