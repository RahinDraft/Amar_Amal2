import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rahinahmed.amaramal',
  appName: 'আমার আমল',
  webDir: 'dist',
  server: {
    url: 'https://amar-amal2.vercel.app/',
    cleartext: true
  }
};

export default config;
