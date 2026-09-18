import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { farmer as C } from './src/theme/colors';
import { ToastProvider } from './src/components/ui';
import { LangProvider } from './src/i18n';
import { AppStoreProvider } from './src/store/AppStore';
import RootNavigator from './src/navigation/RootNavigator';

// How notifications are presented while the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

export default function App() {
  return (
    <SafeAreaProvider>
      <LangProvider>
        <AppStoreProvider>
          <ToastProvider>
            <NavigationContainer theme={{ colors: { background: C.background } }}>
              <StatusBar style="dark" />
              <RootNavigator />
            </NavigationContainer>
          </ToastProvider>
        </AppStoreProvider>
      </LangProvider>
    </SafeAreaProvider>
  );
}
