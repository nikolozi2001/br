/**
 * Geostat Design System tokens, ported from
 * _ds/geostat-design-system/tokens/{colors,typography,shape}.css
 */

export const brand = {
  blue: '#0080be',
  blueHover: '#006a9e',
  blueLight: '#00a3e0',
  red: '#ee1521',
  redDark: '#c81723',
  green: '#16a34a',
  greenDark: '#15803d',
};

export const brandTint = {
  blue05: 'rgba(0,128,190,0.05)',
  blue09: 'rgba(0,128,190,0.09)',
  blue10: 'rgba(0,128,190,0.10)',
  blue16: 'rgba(0,128,190,0.16)',
  blue20: 'rgba(0,128,190,0.20)',
  red10: 'rgba(238,21,33,0.10)',
};

/** Light palette — mirrors the `.brapp` custom-property block. */
export interface Palette {
  bg: string; card: string; ink: string; muted: string; faint: string;
  line: string; line2: string; line3: string; field: string;
  chrome: string; sheet: string; statBg: string;
  scrim: string; scrimStrong: string; skeleton: string;
  mapGrid: string; mapBg: string; mapRoad: string;
}

export const lightPalette: Palette = {
  bg: '#eff3f7',
  card: '#ffffff',
  ink: '#1a1a2e',
  muted: '#64748b',
  faint: '#94a3b8',
  line: '#e8edf2',
  line2: '#e2e8f0',
  line3: '#f0f3f7',
  field: '#f1f5f9',
  chrome: 'rgba(255,255,255,0.96)',
  sheet: 'rgba(248,250,252,0.98)',
  statBg: '#f8fafc',
  scrim: 'rgba(15,23,42,0.4)',
  scrimStrong: 'rgba(15,23,42,0.5)',
  skeleton: '#dfe7ef',
  mapGrid: '#e6edf4',
  mapBg: '#eef3f8',
  mapRoad: '#dfe7ef',
};

/** Dark palette — mirrors `.themeDark`. */
export const darkPalette: Palette = {
  bg: '#0d1a24',
  card: '#14232f',
  ink: '#eaf1f6',
  muted: '#9fb2c0',
  faint: '#6b8296',
  line: '#20323f',
  line2: '#263a49',
  line3: '#1b2b38',
  field: '#1b2c39',
  chrome: 'rgba(16,32,44,0.94)',
  sheet: 'rgba(18,32,44,0.98)',
  statBg: '#1b2c39',
  scrim: 'rgba(2,8,14,0.55)',
  scrimStrong: 'rgba(2,8,14,0.65)',
  skeleton: '#22364a',
  mapGrid: '#1e3140',
  mapBg: '#132330',
  mapRoad: '#1e3140',
};

export const radius = {
  sm: 4,
  md: 6,
  base: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 28,
  pill: 9999,
};

/**
 * Font families registered in App.js. `heading` is BPG Nino Mtavruli — Georgian
 * uppercase display face used for every title in the prototype.
 */
export const fonts = {
  heading: 'GeostatHeading',
  sans: 'GeostatSans',
  sansMedium: 'GeostatSansMedium',
  sansBold: 'GeostatSansBold',
};

/** Multipliers behind the settings screen's A- / A / A+ control (`.fsSmall`, `.fsLarge`). */
export const fontScales: Record<'small' | 'normal' | 'large', number> = {
  small: 0.9,
  normal: 1,
  large: 1.14,
};

export const heroGradient = [brand.blue, brand.blueHover];

/** Chart series colors used across the charts tab. */
export const chartColors = {
  birth: brand.blue,
  death: brand.red,
  // 12 distinct hues — one per region, so the stacked chart never repeats.
  regions: [
    '#0080be', '#a855f7', '#16a34a', '#f59e0b', '#0ea5e9', '#ef4444',
    '#7c3aed', '#0d9488', '#b45309', '#db2777', '#64748b', '#84cc16',
  ],
  pie: ['#0080be', '#22c55e', '#16a34a', '#f59e0b', '#0ea5e9', '#ef4444', '#a855f7'],
  sectors: ['#0080be', '#00a3e0', '#16a34a', '#a855f7', '#f59e0b', '#ef4444'],
  lines: ['#f5c518', '#111827', '#ee1521', '#16a34a'],
  stacked100: ['#0080be', '#ee1521', '#16a34a', '#b45309', '#a855f7', '#f59e0b'],
};

export const shadow = {
  card: {
    shadowColor: '#102a43',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  raised: {
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  cta: {
    shadowColor: brand.blue,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  sheet: {
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 50,
    shadowOffset: { width: 0, height: 20 },
    elevation: 20,
  },
};
