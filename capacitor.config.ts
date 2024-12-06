import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.iut.homework',
  appName: 'IUT Homework',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    CapacitorCookies: {
      enabled: true
    },
    PrivateEnvVars: {
      variables: {
        SUPABASE_URL: process.env.VITE_SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY
      }
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#4F46E5",
      sound: "beep.wav",
    }
  },
  ios: {
    contentInset: 'automatic'
  }
};

export default config;
