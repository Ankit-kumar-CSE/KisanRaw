import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { farmer as C } from './src/theme/colors';
import { ToastProvider } from './src/components/ui';
import { LangProvider } from './src/i18n';
import { AppStoreProvider } from './src/store/AppStore';
import RootNavigator from './src/navigation/RootNavigator';

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
