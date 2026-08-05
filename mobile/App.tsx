import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ErrorBoundary from './src/components/ErrorBoundary';
import Splash from './src/components/Splash';
import Toast from './src/components/Toast';
import RootNavigator from './src/navigation/RootNavigator';
import { AppStoreProvider } from './src/state/AppStore';
import { SearchProvider } from './src/state/SearchStore';
import { getStrings } from './src/i18n/strings';
import { initErrorReporting } from './src/utils/reportError';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync().catch(() => {});
initErrorReporting();

function Shell() {
  const { colors, dark, hydrated, lang } = useTheme();
  const t = getStrings(lang);
  const [splashDone, setSplashDone] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    // BPG Nino Mtavruli — the Georgian display face used for every heading.
    GeostatHeading: require('./assets/fonts/BPGNinoMtavruli.ttf'),
  });

  useEffect(() => {
    if ((fontsLoaded || fontError) && hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError, hydrated]);

  if ((!fontsLoaded && !fontError) || !hydrated) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <ErrorBoundary labels={{ title: t.crashTitle, body: t.crashBody, retry: t.retry }}>
        <AppStoreProvider>
          <SearchProvider>
            <RootNavigator />
            <Toast />
          </SearchProvider>
        </AppStoreProvider>
      </ErrorBoundary>
      {!splashDone ? <Splash onDone={() => setSplashDone(true)} /> : null}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Shell />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
