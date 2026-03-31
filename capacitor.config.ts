import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hiaouan.smarttranslate',
  appName: 'AI Translate',
  webDir: 'dist',
  server: {
    url: 'https://08fd44f3-a7de-4453-b814-2220f5019333.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
};

export default config;
