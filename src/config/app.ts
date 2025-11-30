// Application Configuration
// This file contains app-wide settings that can be easily changed

export const appConfig = {
  // App version and stage
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  stage: import.meta.env.VITE_APP_STAGE || 'beta', // 'beta', 'alpha', 'stable', 'dev'
  
  // Feature flags
  showBetaBadge: import.meta.env.VITE_SHOW_BETA_BADGE !== 'false', // Show by default
  
  // App metadata
  appName: 'Priority Queue Board',
  appDescription: 'จัดการงานด้วย Priority Queue',
  
  // Beta settings
  beta: {
    feedbackUrl: import.meta.env.VITE_FEEDBACK_URL || 'https://forms.gle/your-feedback-form',
    showFeedbackButton: true,
    bannerMessage: 'เวอร์ชัน Beta - ช่วยเราปรับปรุงด้วยการแชร์ความคิดเห็น',
  },
} as const;

// Helper to check if app is in beta
export const isBeta = () => appConfig.stage === 'beta';
export const isAlpha = () => appConfig.stage === 'alpha';
export const isDev = () => appConfig.stage === 'dev';
export const isStable = () => appConfig.stage === 'stable';
