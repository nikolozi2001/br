import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import type { ViewStyle } from 'react-native';

import ChartExportSheet from '../components/ChartExportSheet';
import Icon from '../components/Icon';
import ScreenHeader, { FlagChip } from '../components/ScreenHeader';
import { Card, HeroGradient } from '../components/primitives';
import { GroupedBarChart, HorizontalBars, Legend, LineChart, PieChart, StackedBarChart } from '../components/charts';
import {
  fetchBirthDeath,
  fetchBirthDistribution,
  fetchBirthNace,
  fetchBirthRegion,
  fetchBirthSector,
  fetchDeathDistribution,
  fetchDeathNace,
  fetchDeathRegion,
  fetchDeathSector,
} from '../api/registry';
import { regionLabel } from '../data/regions';
import { getStrings } from '../i18n/strings';
import { useTheme } from '../theme/ThemeProvider';
import type { ApiRecord, BarRow, BirthDeathPoint, Lang, PieSlice, Series } from '../types';

interface ChartData {
  birthDeath: BirthDeathPoint[];
  nace: ApiRecord[];
  naceDeath: ApiRecord[];
  region: ApiRecord[];
  regionDeath: ApiRecord[];
  distribution: ApiRecord[];
  distributionDeath: ApiRecord[];
  sector: ApiRecord[];
  sectorDeath: ApiRecord[];
}

interface NaceSeries {
  years: string[];
  series: Series[];
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
      safe(fetchDeathNace(lang)),
      safe(fetchBirthRegion(lang)),
      safe(fetchDeathRegion(lang)),
      safe(fetchBirthDistribution(lang)),
      safe(fetchDeathDistribution(lang)),
      safe(fetchBirthSector(lang)),
      safe(fetchDeathSector(lang)),
    ])
      .then(
        ([
          birthDeath,
          nace,
          naceDeath,
          region,
          regionDeath,
          distribution,
          distributionDeath,
          sector,
          sectorDeath,
        ]) => {
          if (!cancelled) {
            setData({
              birthDeath,
              nace,
              naceDeath,
              region,
              regionDeath,
              distribution,
              distributionDeath,
              sector,
              sectorDeath,
            });
          }
        },
      )
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const toggle = (key: string) => setFlipped((prev) => ({ ...prev, [key]: !prev[key] }));

  /* ── Derived chart inputs ─────────────────────────────────────────────── */

  // The NACE line chart flips between births and deaths — same structure, one
  // builder, so both stay in sync. `NACE_Rev_2_Code` is the section name,
  // `section_division` its letter. Only the four largest sections stay readable.
  const buildNaceSeries = React.useCallback(
    (rows: ApiRecord[]): NaceSeries | null => {
      if (!rows.length) return null;
      const years = Object.keys(rows[0])
        .filter((k) => /^\d{4}$/.test(k))
        .sort();
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
    },
    [chartColors],
  );

  const naceBirthSeries = useMemo(() => buildNaceSeries(data?.nace ?? []), [data, buildNaceSeries]);
  const naceDeathSeries = useMemo(() => buildNaceSeries(data?.naceDeath ?? []), [data, buildNaceSeries]);
  const naceSeries = flipped.nace ? naceDeathSeries : naceBirthSeries;

  // Region stacked bars flip between births and deaths — one builder, both sets.
  const buildRegionStack = React.useCallback(
    (rows: ApiRecord[]): StackedData | null => {
      if (!rows.length) return null;
      // Region rows are per-year objects: { year, Tbilisi: n, Imereti: n, … }
      const yearKey = Object.keys(rows[0]).find((k) => /year|წელი/i.test(k)) ?? 'year';
      // Drop columns that are zero across every year (e.g. Abkhazia, Unknown).
      const names = Object.keys(rows[0])
        .filter((k) => k !== yearKey && typeof rows[0][k] === 'number')
        .filter((k) => rows.some((r) => Number(r[k]) > 0));
      return {
        years: rows.map((r) => r[yearKey] as string | number),
        segments: names.map((name, i) => ({
          key: name,
          label: regionLabel(name, lang),
          color: chartColors.regions[i % chartColors.regions.length]!,
        })),
        values: rows.map((r) => names.map((n) => Number(r[n]) || 0)),
      };
    },
    [lang, chartColors],
  );

  const regionBirthStack = useMemo(() => buildRegionStack(data?.region ?? []), [data, buildRegionStack]);
  const regionDeathStack = useMemo(() => buildRegionStack(data?.regionDeath ?? []), [data, buildRegionStack]);
  const regionStack = flipped.region ? regionDeathStack : regionBirthStack;

  // The distribution endpoint already returns percentages in `share`.
  const buildPieSlices = React.useCallback(
    (rows: ApiRecord[]): PieSlice[] | null => {
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
    },
    [lang, chartColors],
  );

  const pieBirthSlices = useMemo(() => buildPieSlices(data?.distribution ?? []), [data, buildPieSlices]);
  const pieDeathSlices = useMemo(() => buildPieSlices(data?.distributionDeath ?? []), [data, buildPieSlices]);
  const pieSlices = flipped.pie ? pieDeathSlices : pieBirthSlices;

  const buildSectorPivot = React.useCallback(
    (rows: ApiRecord[]): StackedData | null => {
      if (!rows.length) return null;
      const { years, segments, values } = pivotByYear(rows, 'legend_title', 'legend_title_en', lang);
      return {
        years,
        segments: segments.map((label, i) => ({
          label,
          color: chartColors.stacked100[i % chartColors.stacked100.length]!,
        })),
        values,
      };
    },
    [lang, chartColors],
  );

  const sectorBirthPivot = useMemo(() => buildSectorPivot(data?.sector ?? []), [data, buildSectorPivot]);
  const sectorDeathPivot = useMemo(() => buildSectorPivot(data?.sectorDeath ?? []), [data, buildSectorPivot]);
  const sectorPivot = flipped.sector ? sectorDeathPivot : sectorBirthPivot;

  // The "% by sector (latest year)" bars are always births — a separate card.
  const sectorBars = useMemo(() => {
    if (!sectorBirthPivot || !sectorBirthPivot.years.length) return null;
    const lastIndex = sectorBirthPivot.years.length - 1;
    const lastValues = sectorBirthPivot.values[lastIndex] || [];
    const total = lastValues.reduce((a, b) => a + b, 0) || 1;
    return sectorBirthPivot.segments
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
  }, [sectorBirthPivot, chartColors]);

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
                // Flip toggles the data (births ⇄ deaths); the chart stays a line chart.
                title={
                  flipped.nace
                    ? lang === 'en'
                      ? 'Enterprise deaths by economic activity'
                      : 'საწარმოთა გარდაცვალება ეკონომიკური საქმიანობის სახეების მიხედვით'
                    : lang === 'en'
                      ? 'Enterprise births by economic activity'
                      : 'საწარმოთა დაბადება ეკონომიკური საქმიანობის სახეების მიხედვით'
                }
                flipped={flipped.nace}
                onFlip={() => toggle('nace')}
                onExport={() => setExportChart('nace')}
                captureRef={refFor('nace')}
              >
                <LineChart series={naceSeries.series} labels={naceSeries.years} />
                <Legend line items={naceSeries.series.map((s) => ({ label: s.label, color: s.color }))} />
              </ChartCard>
            ) : null}

            {regionStack ? (
              <ChartCard
                // Flip toggles births ⇄ deaths; the stacked-bar structure stays.
                title={
                  flipped.region
                    ? lang === 'en'
                      ? 'Enterprise deaths by region'
                      : 'საწარმოთა გარდაცვალება რეგიონების მიხედვით'
                    : lang === 'en'
                      ? 'Enterprise births by region'
                      : 'საწარმოთა დაბადება რეგიონების მიხედვით'
                }
                flipped={flipped.region}
                onFlip={() => toggle('region')}
                onExport={() => setExportChart('region')}
                captureRef={refFor('region')}
              >
                <StackedBarChart
                  years={regionStack.years}
                  values={regionStack.values}
                  segments={regionStack.segments}
                />
                <Legend items={regionStack.segments} />
              </ChartCard>
            ) : null}

            {pieSlices ? (
              <ChartCard
                title={
                  flipped.pie
                    ? lang === 'en'
                      ? 'Distribution of enterprise deaths by region'
                      : 'გარდაცვლილ საწარმოთა განაწილება რეგიონების მიხედვით'
                    : lang === 'en'
                      ? 'Distribution of enterprise births by region'
                      : 'დაბადებულ საწარმოთა განაწილება რეგიონების მიხედვით'
                }
                flipped={flipped.pie}
                onFlip={() => toggle('pie')}
                onExport={() => setExportChart('pie')}
                captureRef={refFor('pie')}
              >
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
                  flipped.sector
                    ? lang === 'en'
                      ? 'Share of enterprise deaths by sector'
                      : 'საწარმოთა გარდაცვალების წილი დარგების მიხედვით'
                    : lang === 'en'
                      ? 'Share of enterprise births by sector'
                      : 'საწარმოთა დაბადების წილი დარგების მიხედვით'
                }
                flipped={flipped.sector}
                onFlip={() => toggle('sector')}
                onExport={() => setExportChart('sector')}
                captureRef={refFor('sector')}
              >
                <StackedBarChart
                  normalize
                  years={sectorPivot.years}
                  values={sectorPivot.values}
                  segments={sectorPivot.segments}
                />
                <Legend items={sectorPivot.segments} />
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
