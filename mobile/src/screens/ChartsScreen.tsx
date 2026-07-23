import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import type { ViewStyle } from 'react-native';

import ChartExportSheet from '../components/ChartExportSheet';
import Icon from '../components/Icon';
import ScreenHeader, { FlagChip } from '../components/ScreenHeader';
import { Card, HeroGradient } from '../components/primitives';
import { DataTable, GroupedBarChart, HorizontalBars, Legend, LineChart, PieChart, StackedBarChart } from '../components/charts';
import {
  fetchBirthDeath,
  fetchBirthDistribution,
  fetchBirthNace,
  fetchBirthRegion,
  fetchBirthSector,
  groupDigits,
} from '../api/registry';
import { regionLabel } from '../data/regions';
import { getStrings } from '../i18n/strings';
import { useTheme } from '../theme/ThemeProvider';
import type { ApiRecord, BarRow, BirthDeathPoint, Lang, PieSlice, Series } from '../types';

interface ChartData {
  birthDeath: BirthDeathPoint[];
  nace: ApiRecord[];
  region: ApiRecord[];
  distribution: ApiRecord[];
  sector: ApiRecord[];
}

/** A stacked series keyed by year, with one coloured segment per category. */
interface StackedData {
  years: (string | number)[];
  segments: { key?: string; label: string; color: string }[];
  values: number[][];
}

/** Card chrome: blue title bar with optional flip + export buttons. */
interface ChartCardProps {
  title: string;
  onFlip?: () => void;
  flipped?: boolean;
  onExport: () => void;
  captureRef: React.RefObject<View | null>;
  children: React.ReactNode;
}

function ChartCard({ title, onFlip, flipped, onExport, captureRef, children }: ChartCardProps) {
  const { colors, fonts, fs, radius } = useTheme();
  return (
    <Card ref={captureRef} collapsable={false} style={{ overflow: 'hidden' }} radius={radius.xl}>
      <HeroGradient>
        <View
          style={{
            paddingVertical: 12,
            paddingHorizontal: 15,
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <Text style={{ flex: 1, fontFamily: fonts.heading, fontSize: fs(14), color: '#fff', lineHeight: fs(18) }}>
            {title}
          </Text>
          {onFlip ? (
            <Pressable onPress={onFlip} style={iconButton}>
              <Icon name={flipped ? 'bars' : 'toggleTable'} size={16} color="#fff" />
            </Pressable>
          ) : null}
          <Pressable onPress={onExport} style={iconButton}>
            <Icon name="download" size={17} color="#fff" />
          </Pressable>
        </View>
      </HeroGradient>
      <View style={{ padding: 14, backgroundColor: colors.card }}>{children}</View>
    </Card>
  );
}

const iconButton: ViewStyle = {
  width: 30,
  height: 30,
  borderRadius: 8,
  backgroundColor: 'rgba(255,255,255,0.18)',
  alignItems: 'center',
  justifyContent: 'center',
};

/** Reads a `{legend_title, 2014: n, …}` row set into years + stacked values. */
function pivotByYear(rows: ApiRecord[], labelKey: string, labelKeyEn: string, lang: Lang) {
  const years = rows.length
    ? Object.keys(rows[0])
        .filter((k) => /^\d{4}$/.test(k))
        .sort()
    : [];
  const segments = rows
    .map((r) => String((lang === 'en' ? r[labelKeyEn] || r[labelKey] : r[labelKey]) ?? ''))
    .filter(Boolean);
  const values = years.map((y) => rows.map((r) => Number(r[y]) || 0));
  return { years, segments, values };
}

export default function ChartsScreen() {
  const { chartColors, colors, fs, lang } = useTheme();
  const t = getStrings(lang);

  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [exportChart, setExportChart] = useState<string | null>(null);
  // One capture target per chart card, so export snapshots the right one.
  const cardRefs = useRef<Record<string, React.RefObject<View | null>>>({});
  const refFor = (key: string) => {
    if (!cardRefs.current[key]) cardRefs.current[key] = React.createRef();
    return cardRefs.current[key];
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const safe = <T,>(p: Promise<T[]>): Promise<T[]> => p.catch(() => [] as T[]);
    Promise.all([
      safe(fetchBirthDeath(lang)),
      safe(fetchBirthNace(lang)),
      safe(fetchBirthRegion(lang)),
      safe(fetchBirthDistribution(lang)),
      safe(fetchBirthSector(lang)),
    ])
      .then(([birthDeath, nace, region, distribution, sector]) => {
        if (!cancelled) setData({ birthDeath, nace, region, distribution, sector });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const toggle = (key: string) => setFlipped((prev) => ({ ...prev, [key]: !prev[key] }));

  /* ── Derived chart inputs ─────────────────────────────────────────────── */

  const naceSeries = useMemo(() => {
    const rows = data?.nace ?? [];
    if (!rows.length) return null;
    const years = Object.keys(rows[0])
      .filter((k) => /^\d{4}$/.test(k))
      .sort();
    // Only the four largest sections stay readable at this size.
    // `NACE_Rev_2_Code` carries the section's name; `section_division` its letter.
    const top: Series[] = [...rows]
      .map((r) => ({
        label: String(r.NACE_Rev_2_Code || r.section_division || '—'),
        values: years.map((y) => Number(r[y]) || 0),
        color: '',
      }))
      .sort((a, b) => b.values.reduce((x, y) => x + y, 0) - a.values.reduce((x, y) => x + y, 0))
      .slice(0, 4)
      .map((serie, i) => ({ ...serie, color: chartColors.lines[i] ?? chartColors.birth }));
    return { years, series: top };
  }, [data, chartColors]);

  const regionStack = useMemo(() => {
    const rows = data?.region ?? [];
    if (!rows.length) return null;
    // Region rows are per-year objects: { year, Tbilisi: n, Imereti: n, … }
    const yearKey = Object.keys(rows[0]).find((k) => /year|წელი/i.test(k)) ?? 'year';
    // Drop columns that are zero across every year (e.g. Abkhazia, Unknown).
    const names = Object.keys(rows[0])
      .filter((k) => k !== yearKey && typeof rows[0][k] === 'number')
      .filter((k) => rows.some((r) => Number(r[k]) > 0));
    const stack: StackedData = {
      years: rows.map((r) => r[yearKey] as string | number),
      segments: names.map((name, i) => ({
        key: name,
        label: regionLabel(name, lang),
        color: chartColors.regions[i % chartColors.regions.length]!,
      })),
      values: rows.map((r) => names.map((n) => Number(r[n]) || 0)),
    };
    return stack;
  }, [data, lang, chartColors]);

  // The distribution endpoint already returns percentages in `share`.
  const pieSlices = useMemo(() => {
    const rows = data?.distribution ?? [];
    if (!rows.length) return null;
    const sorted = [...rows].sort((a, b) => (Number(b.share) || 0) - (Number(a.share) || 0));
    const top = sorted.slice(0, 6);
    const restShare = sorted.slice(6).reduce((s, r) => s + (Number(r.share) || 0), 0);
    const slices = top.map((r) => ({ label: String(r.name ?? ''), value: Number(r.share) || 0 }));
    if (restShare > 0) slices.push({ label: lang === 'en' ? 'Other regions' : 'სხვა რეგიონები', value: restShare });
    return slices.map(
      (slice, i): PieSlice => ({
        ...slice,
        percent: `${slice.value.toFixed(1)}%`,
        color: chartColors.pie[i % chartColors.pie.length]!,
      }),
    );
  }, [data, lang, chartColors]);

  const sectorPivot = useMemo(() => {
    const rows = data?.sector ?? [];
    if (!rows.length) return null;
    const { years, segments, values } = pivotByYear(rows, 'legend_title', 'legend_title_en', lang);
    const pivot: StackedData = {
      years,
      segments: segments.map((label, i) => ({
        label,
        color: chartColors.stacked100[i % chartColors.stacked100.length]!,
      })),
      values,
    };
    return pivot;
  }, [data, lang, chartColors]);

  const sectorBars = useMemo(() => {
    if (!sectorPivot || !sectorPivot.years.length) return null;
    const lastIndex = sectorPivot.years.length - 1;
    const lastValues = sectorPivot.values[lastIndex] || [];
    const total = lastValues.reduce((a, b) => a + b, 0) || 1;
    return sectorPivot.segments
      .map(
        (segment, i): BarRow => ({
          label: segment.label,
          value: lastValues[i] || 0,
          display: `${(((lastValues[i] || 0) / total) * 100).toFixed(1)}%`,
          color: chartColors.sectors[i % chartColors.sectors.length]!,
        }),
      )
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [sectorPivot, chartColors]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title={t.chartsTitle} subtitle={t.chartsSubtitle} actions={<FlagChip lang={lang} />} />

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 108, gap: 14 }}>
        {loading ? (
          <ActivityIndicator color={colors.brand} style={{ marginTop: 40 }} />
        ) : (
          <>
            {data?.birthDeath?.length ? (
              <ChartCard
                title={
                  lang === 'en'
                    ? 'Enterprise births and deaths'
                    : 'საწარმოთა დაბადება და გარდაცვალება'
                }
                onExport={() => setExportChart('birthDeath')}
                captureRef={refFor('birthDeath')}
              >
                <Legend
                  items={[
                    { label: t.birth, color: chartColors.birth },
                    { label: t.death, color: chartColors.death },
                  ]}
                />
                <View style={{ marginTop: 10 }}>
                  <GroupedBarChart data={data.birthDeath} />
                </View>
              </ChartCard>
            ) : null}

            {naceSeries ? (
              <ChartCard
                title={
                  lang === 'en'
                    ? 'Enterprise births by economic activity'
                    : 'საწარმოთა დაბადება ეკონომიკური საქმიანობის სახეების მიხედვით'
                }
                flipped={flipped.nace}
                onFlip={() => toggle('nace')}
                onExport={() => setExportChart('nace')}
                captureRef={refFor('nace')}
              >
                {flipped.nace ? (
                  <DataTable
                    columns={[t.activityName, naceSeries.years.at(-1) ?? '']}
                    rows={naceSeries.series.map((s) => [s.label, groupDigits(s.values.at(-1))])}
                  />
                ) : (
                  <>
                    <LineChart series={naceSeries.series} labels={naceSeries.years} />
                    <Legend line items={naceSeries.series.map((s) => ({ label: s.label, color: s.color }))} />
                  </>
                )}
              </ChartCard>
            ) : null}

            {regionStack ? (
              <ChartCard
                title={lang === 'en' ? 'Enterprise births by region' : 'საწარმოთა დაბადება რეგიონების მიხედვით'}
                flipped={flipped.region}
                onFlip={() => toggle('region')}
                onExport={() => setExportChart('region')}
                captureRef={refFor('region')}
              >
                {flipped.region ? (
                  <DataTable
                    columns={[t.region, regionStack.years.at(-1) ?? '']}
                    rows={regionStack.segments.map((s, i) => [
                      s.label,
                      groupDigits(regionStack.values.at(-1)?.[i] ?? 0),
                    ])}
                  />
                ) : (
                  <>
                    <StackedBarChart
                      years={regionStack.years}
                      values={regionStack.values}
                      segments={regionStack.segments}
                    />
                    <Legend items={regionStack.segments} />
                  </>
                )}
              </ChartCard>
            ) : null}

            {pieSlices ? (
              <ChartCard
                title={
                  lang === 'en'
                    ? 'Distribution of enterprise births by region'
                    : 'დაბადებულ საწარმოთა განაწილება რეგიონების მიხედვით'
                }
                flipped={flipped.pie}
                onFlip={() => toggle('pie')}
                onExport={() => setExportChart('pie')}
                captureRef={refFor('pie')}
              >
                {flipped.pie ? (
                  <DataTable columns={[t.region, '%']} rows={pieSlices.map((s) => [s.label, s.percent])} />
                ) : (
                  <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <PieChart slices={pieSlices} />
                    <View style={{ gap: 7, flex: 1, minWidth: 120 }}>
                      {pieSlices.map((s) => (
                        <View key={s.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                          <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: s.color }} />
                          <Text style={{ fontSize: fs(11.5), color: colors.muted, flex: 1 }} numberOfLines={1}>
                            {`${s.label} · ${s.percent}`}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </ChartCard>
            ) : null}

            {sectorBars ? (
              <ChartCard
                title={
                  lang === 'en'
                    ? 'Enterprise births by sector (latest year, %)'
                    : 'საწარმოთა დაბადება დარგების მიხედვით (%)'
                }
                onExport={() => setExportChart('sectorBars')}
                captureRef={refFor('sectorBars')}
              >
                <HorizontalBars rows={sectorBars} />
              </ChartCard>
            ) : null}

            {sectorPivot ? (
              <ChartCard
                title={
                  lang === 'en'
                    ? 'Share of enterprise births by sector'
                    : 'საწარმოთა დაბადების წილი დარგების მიხედვით'
                }
                flipped={flipped.sector}
                onFlip={() => toggle('sector')}
                onExport={() => setExportChart('sector')}
                captureRef={refFor('sector')}
              >
                {flipped.sector ? (
                  <DataTable
                    columns={[t.activityName, sectorPivot.years.at(-1) ?? '']}
                    rows={sectorPivot.segments.map((s, i) => [
                      s.label,
                      groupDigits(sectorPivot.values.at(-1)?.[i] ?? 0),
                    ])}
                  />
                ) : (
                  <>
                    <StackedBarChart
                      normalize
                      years={sectorPivot.years}
                      values={sectorPivot.values}
                      segments={sectorPivot.segments}
                    />
                    <Legend items={sectorPivot.segments} />
                  </>
                )}
              </ChartCard>
            ) : null}
          </>
        )}
      </ScrollView>

      <ChartExportSheet
        visible={Boolean(exportChart)}
        onClose={() => setExportChart(null)}
        viewRef={exportChart ? refFor(exportChart) : null}
      />
    </View>
  );
}
