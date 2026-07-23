import React from 'react';
import { Text, View } from 'react-native';
import Svg, { G, Line, Path, Polyline, Rect, Text as SvgText } from 'react-native-svg';

import { useTheme } from '../theme/ThemeProvider';
import type { BarRow, BirthDeathPoint, LegendItem, PieSlice, Series } from '../types';

const W = 330;
/** Room for the y-axis tick labels. */
const AXIS_PAD = 34;

/** 57583 → "57.6k" — keeps axis labels inside AXIS_PAD. */
function tickLabel(value: number): string {
  if (Math.abs(value) >= 1000) {
    const k = value / 1000;
    return `${k >= 10 ? Math.round(k) : k.toFixed(1)}k`;
  }
  return String(Math.round(value));
}

/** Coloured swatch row shared by every chart. */
export function Legend({ items, line = false }: { items: LegendItem[]; line?: boolean }) {
  const { colors, fs } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12, columnGap: 14 }}>
      {items.map((item, index) => (
        <View key={`${item.label}-${index}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={{
              width: line ? 14 : 11,
              height: line ? 3 : 11,
              borderRadius: line ? 0 : 2,
              backgroundColor: item.color,
            }}
          />
          <Text style={{ fontSize: fs(11.5), color: colors.muted }}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

/** Value table shown when a chart card is flipped. */
export function DataTable({ columns, rows }: { columns: (string | number)[]; rows: [string, string][] }) {
  const { colors, fs } = useTheme();
  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 9,
          paddingHorizontal: 2,
          borderBottomWidth: 2,
          borderBottomColor: colors.line2,
        }}
      >
        {columns.map((c, i) => (
          <Text
            key={c}
            style={{ fontSize: fs(12), fontWeight: '700', color: colors.brand, textAlign: i ? 'right' : 'left' }}
          >
            {c}
          </Text>
        ))}
      </View>
      {rows.map((row, index) => (
        <View
          key={`${row[0]}-${index}`}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 12,
            paddingVertical: 11,
            paddingHorizontal: 2,
            borderBottomWidth: 1,
            borderBottomColor: colors.line3,
          }}
        >
          <Text style={{ fontSize: fs(13), color: colors.ink, flex: 1 }}>{row[0]}</Text>
          <Text style={{ fontSize: fs(13), color: colors.ink, fontWeight: '600' }}>{row[1]}</Text>
        </View>
      ))}
    </View>
  );
}

/** Grouped bars — births vs deaths per year. */
export function GroupedBarChart({ data }: { data: BirthDeathPoint[] }) {
  const { colors } = useTheme();
  const H = 185;
  const pad = AXIS_PAD;
  const base = H - 22;
  const max = Math.max(1, ...data.flatMap((d) => [d.birth, d.death]));
  const step = (W - pad) / Math.max(1, data.length);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));

  return (
    <Svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
      {ticks.map((value, i) => {
        const y = base - (value / max) * (base - 8);
        return (
          <G key={value + '-' + i}>
            <Line x1={pad} y1={y} x2={W} y2={y} stroke={colors.line} strokeWidth={1} />
            <SvgText x={pad - 4} y={y + 3} fontSize={8} fill="#94a3b8" textAnchor="end">
              {tickLabel(value)}
            </SvgText>
          </G>
        );
      })}
      {data.map((d, i) => {
        const x = pad + i * step;
        const bh = (d.birth / max) * (base - 8);
        const dh = (d.death / max) * (base - 8);
        return (
          <G key={d.year}>
            <Rect x={x + step * 0.22} y={base - bh} width={step * 0.26} height={bh} fill={colors.brand} rx={1.5} />
            <Rect x={x + step * 0.52} y={base - dh} width={step * 0.26} height={dh} fill={colors.red} rx={1.5} />
            <SvgText x={x + step * 0.5} y={H - 5} fontSize={8.5} fill="#94a3b8" textAnchor="middle">
              {String(d.year).slice(-2)}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

/** Multi-series line chart. `series` = [{ label, color, values }]. */
export function LineChart({ series, labels }: { series: Series[]; labels: (string | number)[] }) {
  const { colors } = useTheme();
  const H = 180;
  const pad = AXIS_PAD;
  // Leave room so the last x-axis label is not clipped by the viewBox edge.
  const right = W - 12;
  const base = H - 20;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const n = labels.length;
  const xAt = (i: number) => pad + i * ((right - pad) / Math.max(1, n - 1));
  const ticks = [0, 0.34, 0.67, 1].map((f) => Math.round(max * f));
  // With many years, label every other one so they do not collide.
  const labelStep = n > 8 ? 2 : 1;

  return (
    <Svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
      {ticks.map((value, i) => {
        const y = base - (value / max) * (base - 8);
        return (
          <G key={value + '-' + i}>
            <Line x1={pad} y1={y} x2={right} y2={y} stroke={colors.line} strokeWidth={1} />
            <SvgText x={pad - 4} y={y + 3} fontSize={8} fill="#94a3b8" textAnchor="end">
              {tickLabel(value)}
            </SvgText>
          </G>
        );
      })}
      {series.map((s, si) => (
        <Polyline
          key={`${s.label}-${si}`}
          points={s.values.map((v, i) => `${xAt(i)},${base - (v / max) * (base - 8)}`).join(' ')}
          fill="none"
          stroke={s.color}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
      {labels.map((label, i) =>
        i % labelStep === 0 || i === n - 1 ? (
          <SvgText key={`${label}-${i}`} x={xAt(i)} y={H - 4} fontSize={8.5} fill="#94a3b8" textAnchor="middle">
            {String(label).slice(-2)}
          </SvgText>
        ) : null,
      )}
    </Svg>
  );
}

/** Stacked bars, one bar per year. `segments` = [{ label, color }]. */
export interface StackedBarChartProps {
  years: (string | number)[];
  /** One inner array per year, values ordered to match `segments`. */
  values: number[][];
  segments: LegendItem[];
  /** Render every bar full-height, showing composition rather than totals. */
  normalize?: boolean;
}

export function StackedBarChart({ years, values, segments, normalize = false }: StackedBarChartProps) {
  const H = 170;
  const max = normalize ? 1 : Math.max(1, ...values.map((v) => v.reduce((a, b) => a + b, 0)));
  const step = W / Math.max(1, years.length);
  const barWidth = Math.min(14, step * 0.5);

  return (
    <Svg viewBox={`0 0 ${W} ${H + 16}`} width="100%" height={H + 16}>
      {years.map((year, i) => {
        const stack = values[i] || [];
        const sum = stack.reduce((a, b) => a + b, 0) || 1;
        const totalHeight = normalize ? H : (sum / max) * H;
        const x = i * step + (step - barWidth) / 2;
        let y = H;
        return (
          <G key={year}>
            {stack.map((v, si) => {
              const h = (v / sum) * totalHeight;
              y -= h;
              return <Rect key={si} x={x} y={y} width={barWidth} height={Math.max(0, h)} fill={segments[si]?.color ?? '#cbd5e1'} />;
            })}
            <SvgText x={i * step + step / 2} y={H + 12} fontSize={8.5} fill="#94a3b8" textAnchor="middle">
              {String(year).slice(-2)}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

/** Full pie (no donut hole), matching the prototype's region distribution. */
export function PieChart({ slices, size = 130 }: { slices: PieSlice[]; size?: number }) {
  const cx = 70;
  const cy = 70;
  const r = 66;
  const totalValue = slices.reduce((sum, s) => sum + s.value, 0) || 1;
  let angle = -Math.PI / 2;

  return (
    <Svg viewBox="0 0 140 140" width={size} height={size}>
      {slices.map((slice, index) => {
        const sweep = (slice.value / totalValue) * 2 * Math.PI;
        const x1 = cx + r * Math.cos(angle);
        const y1 = cy + r * Math.sin(angle);
        angle += sweep;
        const x2 = cx + r * Math.cos(angle);
        const y2 = cy + r * Math.sin(angle);
        const largeArc = sweep > Math.PI ? 1 : 0;
        return (
          <Path
            key={`${slice.label}-${index}`}
            d={`M${cx} ${cy} L${x1} ${y1} A${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
            fill={slice.color}
          />
        );
      })}
    </Svg>
  );
}

/** Labelled horizontal progress bars. */
export function HorizontalBars({ rows }: { rows: BarRow[] }) {
  const { colors, fs } = useTheme();
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <View style={{ gap: 12 }}>
      {rows.map((r, index) => (
        <View key={`${r.label}-${index}`} style={{ gap: 5 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            <Text style={{ fontSize: fs(12), color: colors.ink, flex: 1 }} numberOfLines={1}>
              {r.label}
            </Text>
            <Text style={{ fontSize: fs(12), color: colors.ink, fontWeight: '700' }}>{r.display}</Text>
          </View>
          <View style={{ height: 9, backgroundColor: colors.field, borderRadius: 5, overflow: 'hidden' }}>
            <View style={{ width: `${(r.value / max) * 100}%`, height: '100%', backgroundColor: r.color, borderRadius: 5 }} />
          </View>
        </View>
      ))}
    </View>
  );
}
