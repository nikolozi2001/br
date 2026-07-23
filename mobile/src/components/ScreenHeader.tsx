import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GeostatLogoSvg from '../../assets/svg/geostat_logo.svg';
import GeoFlag from '../../assets/svg/geo.svg';
import UkFlag from '../../assets/svg/uk.svg';
import { useTheme } from '../theme/ThemeProvider';
import { HeroGradient } from './primitives';
import type { Lang } from '../types';

/**
 * Geostat wordmark. The source artwork is in PDF (Y-up) coordinates and
 * react-native-svg drops the flipping root transform, so the flip is applied
 * here instead. `color` tints it — every fill in the file is `currentColor`.
 */
export function GeostatLogo({ height, color = '#ffffff' }: { height: number; color?: string }) {
  const width = height * (360.464 / 63);
  return (
    <GeostatLogoSvg
      width={width}
      height={height}
      color={color}
      fill={color}
      style={{ transform: [{ scaleY: -1 }] }}
    />
  );
}

/** 38×26 rounded flag chip used in headers and the language setting. */
export function FlagChip({ lang, width = 38, height = 26 }: { lang: Lang; width?: number; height?: number }) {
  const Flag = lang === 'en' ? UkFlag : GeoFlag;
  return (
    <View
      style={{
        width,
        height,
        borderRadius: 6,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
      }}
    >
      <Flag width={width} height={height} preserveAspectRatio="xMidYMid slice" />
    </View>
  );
}

/**
 * Tab-root header: white Geostat wordmark, optional right-hand actions, then a
 * big title / subtitle block on the blue gradient.
 */
export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Rendered to the right of the wordmark (favourites, language toggle…). */
  actions?: React.ReactNode;
  logoHeight?: number;
}

export default function ScreenHeader({ title, subtitle, actions, logoHeight = 44 }: ScreenHeaderProps) {
  const { fonts, fs } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <HeroGradient>
      <View
        style={{
          paddingTop: insets.top + 10,
          paddingHorizontal: 16,
          paddingBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <GeostatLogo height={logoHeight} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>{actions}</View>
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 2, paddingBottom: 14 }}>
        <Text style={{ fontFamily: fonts.heading, fontSize: fs(23), color: '#fff', letterSpacing: -0.35 }}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ marginTop: 4, fontSize: fs(13), color: 'rgba(255,255,255,0.82)' }}>{subtitle}</Text>
        ) : null}
      </View>
    </HeroGradient>
  );
}
