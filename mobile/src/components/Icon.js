import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

/**
 * The prototype's inline 24×24 stroke icons. `color` maps to `currentColor`,
 * `fill` is only used by the tab bar's soft-filled active state.
 */
const PATHS = {
  search: ({ color, fill, width }) => (
    <>
      <Circle cx={11} cy={11} r={7} fill={fill || 'none'} stroke={color} strokeWidth={width} />
      <Path d="M21 21l-4-4" stroke={color} strokeWidth={width} strokeLinecap="round" />
    </>
  ),
  back: ({ color, width }) => (
    <Path d="M15 6l-6 6 6 6" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
  ),
  chevronRight: ({ color, width }) => (
    <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
  ),
  chevronDown: ({ color, width }) => (
    <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
  ),
  heart: ({ color, width, filled }) => (
    <Path
      d="M12 21s-7-4.5-9.5-9A5.3 5.3 0 0112 5a5.3 5.3 0 019.5 7c-2.5 4.5-9.5 9-9.5 9z"
      fill={filled ? color : 'none'}
      stroke={color}
      strokeWidth={width}
      strokeLinejoin="round"
    />
  ),
  share: ({ color, width }) => (
    <>
      <Path d="M12 15V4M8 8l4-4 4 4" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 12v6a2 2 0 002 2h8a2 2 0 002-2v-6" stroke={color} strokeWidth={width} strokeLinecap="round" />
    </>
  ),
  download: ({ color, width }) => (
    <>
      <Path d="M12 3v11M8 10l4 4 4-4" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 20h14" stroke={color} strokeWidth={width} strokeLinecap="round" />
    </>
  ),
  close: ({ color, width }) => (
    <Path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth={width} strokeLinecap="round" />
  ),
  clock: ({ color, width }) => (
    <>
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={width} />
      <Path d="M12 8v4l3 2" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  pin: ({ color, width, filled }) => (
    <>
      <Path
        d="M12 21s7-6.3 7-11a7 7 0 10-14 0c0 4.7 7 11 7 11z"
        fill={filled ? color : 'none'}
        stroke={filled ? '#fff' : color}
        strokeWidth={width}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={10} r={2.5} fill={filled ? '#fff' : 'none'} stroke={filled ? 'none' : color} strokeWidth={width} />
    </>
  ),
  card: ({ color, width }) => (
    <>
      <Rect x={3} y={5} width={18} height={14} rx={2} stroke={color} strokeWidth={width} />
      <Circle cx={8} cy={11} r={2} stroke={color} strokeWidth={width} />
      <Path d="M14 10h4M14 14h4" stroke={color} strokeWidth={width} strokeLinecap="round" />
    </>
  ),
  table: ({ color, fill, width }) => (
    <>
      <Rect x={3} y={4} width={18} height={16} rx={2} fill={fill || 'none'} stroke={color} strokeWidth={width} />
      <Path d="M3 9h18M9 4v16" stroke={color} strokeWidth={width} />
    </>
  ),
  bars: ({ color, width }) => (
    <Path d="M3 20h18M6 20v-7M12 20V5M18 20v-10" stroke={color} strokeWidth={width} strokeLinecap="round" />
  ),
  gear: ({ color, fill, width }) => (
    <>
      <Circle cx={12} cy={12} r={3} fill={fill || 'none'} stroke={color} strokeWidth={width} />
      <Path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 008 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H2a2 2 0 010-4h.09A1.65 1.65 0 004.6 8a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V2a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H22a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  moon: ({ color, width }) => (
    <Path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z" stroke={color} strokeWidth={width} strokeLinejoin="round" />
  ),
  check: ({ color, width }) => (
    <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
  ),
  printer: ({ color, width }) => (
    <Path
      d="M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-4a2 2 0 012-2h16a2 2 0 012 2v4a2 2 0 01-2 2h-2M6 14h12v7H6z"
      stroke={color}
      strokeWidth={width}
      strokeLinejoin="round"
    />
  ),
  external: ({ color, width }) => (
    <Path d="M7 17L17 7M17 7H8M17 7v9" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
  ),
  refresh: ({ color, width }) => (
    <Path d="M21 12a9 9 0 11-3-6.7M21 3v5h-5" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
  ),
  arrowDown: ({ color, width }) => (
    <Path d="M12 5v14M5 12l7 7 7-7" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
  ),
  toggleTable: ({ color, width }) => (
    <>
      <Path d="M13 8h7M13 12h5M13 16h7" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 6v4h4" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 10a5 5 0 1 1 1.2 4.5" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  emptyReport: ({ color, width }) => (
    <>
      <Path d="M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-8" stroke={color} strokeWidth={width} strokeLinecap="round" />
      <Path d="M7 13h6M7 17h8M16 3l5 5-6 1 1-6z" stroke={color} strokeWidth={width} strokeLinejoin="round" />
    </>
  ),
};

export default function Icon({ name, size = 20, color = '#1a1a2e', width = 2, fill, filled = false }) {
  const render = PATHS[name];
  if (!render) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {render({ color, width, fill, filled })}
    </Svg>
  );
}
