import { Sparkles, MessageSquare } from 'lucide-react';
import { appConfig, isBeta } from '../../config/app';

interface BetaBadgeProps {
  variant?: 'compact' | 'full';
  showFeedback?: boolean;
}

export function BetaBadge({ variant = 'compact', showFeedback = true }: BetaBadgeProps) {
  if (!appConfig.showBetaBadge || !isBeta()) return null;

  const handleFeedback = () => {
    window.open(appConfig.beta.feedbackUrl, '_blank');
  };

  if (variant === 'compact') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full shadow-lg shadow-purple-600/30 animate-pulse">
        <Sparkles className="w-3 h-3" />
        BETA
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-600/20 rounded-xl p-3 md:p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-purple-900 dark:text-purple-300">
              {appConfig.appName} v{appConfig.version}
            </h3>
            <span className="px-2 py-0.5 bg-purple-600 text-white text-xs font-bold rounded-full">
              BETA
            </span>
          </div>
          <p className="text-xs text-purple-800 dark:text-purple-400">
            {appConfig.beta.bannerMessage}
          </p>
        </div>
        {showFeedback && appConfig.beta.showFeedbackButton && (
          <button
            onClick={handleFeedback}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors flex-shrink-0"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Feedback</span>
          </button>
        )}
      </div>
    </div>
  );
}
