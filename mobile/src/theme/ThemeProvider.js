import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  brand,
  brandTint,
  chartColors,
  darkPalette,
  fonts,
  fontScales,
  lightPalette,
  radius,
  shadow,
} from './tokens';

const STORAGE_KEY = 'br.settings.v1';

const DEFAULT_SETTINGS = {
  dark: false,
  fontSize: 'normal',
  lang: 'ka',
  defaultActiveOnly: true,
  saveHistory: true,
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled) return;
        if (raw) {
          try {
            setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
          } catch {
            // corrupted payload — fall back to defaults
          }
        }
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(() => {
    const palette = settings.dark ? darkPalette : lightPalette;
    const scale = fontScales[settings.fontSize] ?? 1;

    return {
      hydrated,
      settings,
      update,
      dark: settings.dark,
      lang: settings.lang,
      /** Scales a design-spec pixel size by the user's font-size preference. */
      fs: (size) => Math.round(size * scale * 100) / 100,
      scale,
      colors: {
        ...palette,
        brand: brand.blue,
        brandHover: brand.blueHover,
        brandLight: brand.blueLight,
        red: brand.red,
        redDark: brand.redDark,
        green: brand.green,
        greenDark: brand.greenDark,
        tint: brandTint,
      },
      radius,
      fonts,
      shadow,
      chartColors,
    };
  }, [settings, hydrated, update]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
