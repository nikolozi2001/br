import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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
  type Palette,
} from './tokens';
import type { FontSize, Lang } from '../types';

const STORAGE_KEY = 'br.settings.v1';

export interface Settings {
  dark: boolean;
  fontSize: FontSize;
  lang: Lang;
  defaultActiveOnly: boolean;
  saveHistory: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  dark: false,
  fontSize: 'normal',
  lang: 'ka',
  defaultActiveOnly: true,
  saveHistory: true,
};

export interface ThemeColors extends Palette {
  brand: string;
  brandHover: string;
  brandLight: string;
  red: string;
  redDark: string;
  green: string;
  greenDark: string;
  tint: typeof brandTint;
}

export interface ThemeValue {
  hydrated: boolean;
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  dark: boolean;
  lang: Lang;
  /** Scales a design-spec pixel size by the user's font-size preference. */
  fs: (size: number) => number;
  scale: number;
  colors: ThemeColors;
  radius: typeof radius;
  fonts: typeof fonts;
  shadow: typeof shadow;
  chartColors: typeof chartColors;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        try {
          setSettings({ ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) });
        } catch {
          // corrupted payload — fall back to defaults
        }
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<ThemeValue>(() => {
    const palette = settings.dark ? darkPalette : lightPalette;
    const scale = fontScales[settings.fontSize] ?? 1;

    return {
      hydrated,
      settings,
      update,
      dark: settings.dark,
      lang: settings.lang,
      fs: (size: number) => Math.round(size * scale * 100) / 100,
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

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
