import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.milkdelivery.app',
  appName: 'Milk Delivery',
  webDir: 'out',
  server: {
    // REPLACE THIS with your deployed URL for production (e.g., 'https://your-app.vercel.app')
    // Use 'http://10.0.2.2:3000' for Android Emulator testing locally
    // Use your computer's local IP (e.g., 'http://192.168.1.x:3000') for testing on a real device
    url: 'http://10.0.2.2:3000',
    cleartext: true
  }
};

export default config;
