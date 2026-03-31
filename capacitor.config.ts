import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hiaouan.smarttranslate', // หรือชื่อที่เฮียตั้งไว้ล่าสุด
  appName: 'AI Translate',
  webDir: 'dist' // ตรงนี้สำคัญมาก ต้องมั่นใจว่าเป็น 'dist'
};

export default config;
