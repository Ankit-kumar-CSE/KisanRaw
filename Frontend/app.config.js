// Dynamic Expo config — reads sensitive keys from .env at build/start time.
// Expo automatically loads .env before evaluating this file.
// After updating .env, restart the dev server: expo start --clear

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

module.exports = {
  expo: {
    name: 'kisanRaw',
    slug: 'kisanraw',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    splash: {
      backgroundColor: '#004625',
    },
    ios: {
      supportsTablet: true,
      config: {
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
      },
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'KisanSetu needs your location to show nearby procurement centres and estimate travel time.',
        NSLocationAlwaysUsageDescription:
          'KisanSetu uses your location to show nearby mandi centres.',
      },
    },
    android: {
      package: 'com.ankitkumarjaat.kisanraw',
      config: {
        googleMaps: {
          apiKey: GOOGLE_MAPS_API_KEY,
        },
      },
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'RECEIVE_BOOT_COMPLETED',
        'VIBRATE',
      ],
    },
    plugins: [
      'expo-font',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'KisanSetu needs your location to show nearby procurement centres and estimate travel time.',
        },
      ],
      [
        'expo-notifications',
        {
          icon: './src/logo.png',
          color: '#004625',
          sounds: [],
        },
      ],
    ],
    extra: {
      eas: {
        projectId: '7776cd28-ac22-456f-9de3-26d99b3a7c49',
      },
    },
  },
};
