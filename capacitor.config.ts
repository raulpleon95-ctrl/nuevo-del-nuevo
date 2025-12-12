import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.secundaria27.manager',
  appName: 'Secundaria 27',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;