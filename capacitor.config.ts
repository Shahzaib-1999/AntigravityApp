import type { CapacitorConfig } from '@capacitor/cli';
/// <reference types="@codetrix-studio/capacitor-google-auth" />

const config: CapacitorConfig = {
  appId: 'com.base44.app',
  appName: 'Base44 App',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      // Use your Web Client ID from the Google Cloud console
      // (this must match the one configured in google-services.json)
      serverClientId: '1087183331518-dvoahcg4382n32g69lqkdj6p1rr3bmtd.apps.googleusercontent.com',
      androidClientId: '1087183331518-dvoahcg4382n32g69lqkdj6p1rr3bmtd.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
