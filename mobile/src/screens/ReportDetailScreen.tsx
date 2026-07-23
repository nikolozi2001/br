import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import type { TextStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ReportExportSheet from '../components/ReportExportSheet';
import { Card, EmptyState, HeroGradient, RoundButton } from '../components/primitives';
import { fetchReport, groupDigits } from '../api/registry';
import { getReport, parseCountsReport, parseMatrixReport } from '../data/reports';
import { getStrings } from '../i18n/strings';
import { useTheme, type ThemeColors } from '../theme/ThemeProvider';
import type { ReportsScreenProps } from '../navigation/types';
import { isCountsReport, type ApiRecord, type ParsedReport, type ReportMeta } from '../types';

interface StatTileProps {
  label: string;
  value: string;
  percent?: string | null;
  percentColor: string;
  /** Rendered on the blue totals banner rather than a white card. */
  onBlue?: boolean;
}

function StatTile({ label, value, percent, percentColor, onBlue = false }: StatTileProps) {
  const { colors, fs } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: onBlue ? 'rgba(255,255,255,0.12)' : colors.statBg,
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 10,
      }}
    >
      <Text style={{ fontSize: fs(11), color: onBlue ? 'rgba(255,255,255,0.7)' : colors.faint }}>{label}</Text>
      <Text style={{ fontSize: fs(onBlue ? 16 : 15), fontWeight: '700', color: onBlue ? '#fff' : colors.ink }}>
        {value}
        {percent ? (
          <Text style={{ fontSize: fs(11), fontWeight: '600', color: percentColor }}>{` ${percent}`}</Text>
        ) : null}
      </Text>
    </View>
  );
}

export default function ReportDetailScreen({ navigation, route }: ReportsScreenProps<'ReportDetail'>) {
  const report = getReport(route.params.id);
  if (!report) return null;

  return <ReportDetail report={report} onBack={() => navigation.goBack()} />;
}

function ReportDetail({ report, onBack }: { report: ReportMeta; onBack: () => void }) {
  const { colors, fonts, fs, lang, radius, shadow } = useTheme();
  const t = getStrings(lang);
  const insets = useSafeAreaInsets();

  const [rows, setRows] = useState<ApiRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchReport(report.id, lang)
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [report.id, lang]);

  const parsed = useMemo<ParsedReport | null>(() => {
    if (!rows) return null;
    return report.shape === 'counts' ? parseCountsReport(rows, report) : parseMatrixReport(rows);
  }, [rows, report]);

  const counts = isCountsReport(parsed) ? parsed : null;
  const matrix = !isCountsReport(parsed) ? parsed : null;
  const isEmpty = !loading && (!parsed || (counts ? !counts.items.length : !matrix?.items.length));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <HeroGradient>
        <View
          style={{
            paddingTop: insets.top + 12,
            paddingHorizontal: 16,
            paddingBottom: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <RoundButton icon="back" color="#fff" background="rgba(255,255,255,0.16)" onPress={onBack} />
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: fonts.heading, fontSize: fs(13), color: '#fff' }}>{report.id}</Text>
            </View>
            <Text style={{ fontFamily: fonts.heading, fontSize: fs(15), color: '#fff' }}>{t.report}</Text>
          </View>
          <RoundButton icon="share" color={colors.brand} background="#fff" elevated onPress={() => setShareOpen(true)} />
        </View>
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <Text style={{ fontSize: fs(13), color: 'rgba(255,255,255,0.85)', lineHeight: fs(18) }}>
            {report.title[lang] ?? report.title.ka}
          </Text>
        </View>
      </HeroGradient>

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 108, gap: 10 }}>
        {loading ? (
          <ActivityIndicator color={colors.brand} style={{ marginTop: 40 }} />
        ) : isEmpty ? (
          <Card style={{ paddingVertical: 40, paddingHorizontal: 24 }}>
            <EmptyState icon="emptyReport" title={t.reportEmptyTitle} body={t.reportEmptyBody} size={78} />
          </Card>
        ) : counts ? (
          <>
            <HeroGradient style={{ borderRadius: radius.lg + 2, padding: 14, gap: 9 }}>
              <Text style={{ fontFamily: fonts.heading, fontSize: fs(15), color: '#fff' }}>{t.total}</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <StatTile onBlue label={t.registered} value={groupDigits(counts.totalReg)} percent="100.0%" percentColor="#bbf7d0" />
                <StatTile onBlue label={t.activeCount} value={groupDigits(counts.totalAct)} percent="100.0%" percentColor="#bbf7d0" />
              </View>
            </HeroGradient>

            {counts.items.map((row, index) => (
              <View
                key={`${row.code}-${index}`}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: radius.lg + 2,
                  borderWidth: 1,
                  borderColor: colors.line,
                  paddingVertical: 13,
                  paddingHorizontal: 14,
                  gap: 9,
                  ...shadow.card,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                  <View
                    style={{
                      minWidth: 28,
                      height: 22,
                      paddingHorizontal: 7,
                      borderRadius: 7,
                      backgroundColor: colors.tint.blue10,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: fs(12), fontWeight: '700', color: colors.brand }}>{row.code}</Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: fs(14), color: colors.ink, fontWeight: '600', lineHeight: fs(18) }}>
                    {row.name}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <StatTile label={t.registered} value={groupDigits(row.reg)} percent={row.regP} percentColor={colors.brand} />
                  <StatTile label={t.activeCount} value={groupDigits(row.act)} percent={row.actP} percentColor={colors.green} />
                </View>
              </View>
            ))}
          </>
        ) : (
          <Card style={{ overflow: 'hidden' }}>
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View>
                <View style={{ flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: colors.line2 }}>
                  <Text style={[headerCell(fs, colors), { width: 190 }]} />
                  {matrix!.columns.map((c) => (
                    <Text key={c} style={[headerCell(fs, colors), { width: 84, textAlign: 'right' }]}>
                      {c}
                    </Text>
                  ))}
                </View>
                {matrix!.items.map((row, index) => (
                  <View
                    key={`${row.label}-${index}`}
                    style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.line3 }}
                  >
                    <Text style={[bodyCell(fs, colors), { width: 190, fontWeight: '600' }]} numberOfLines={2}>
                      {row.label}
                    </Text>
                    {row.values.map((v, i) => (
                      <Text key={i} style={[bodyCell(fs, colors), { width: 84, textAlign: 'right' }]}>
                        {v == null ? '—' : groupDigits(v)}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </Card>
        )}
      </ScrollView>

      <ReportExportSheet
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        report={report}
        parsed={parsed}
      />
    </View>
  );
}

const headerCell = (fs: (n: number) => number, colors: ThemeColors): TextStyle => ({
  paddingVertical: 9,
  paddingHorizontal: 10,
  fontSize: fs(12),
  fontWeight: '700',
  color: colors.brand,
});

const bodyCell = (fs: (n: number) => number, colors: ThemeColors): TextStyle => ({
  paddingVertical: 11,
  paddingHorizontal: 10,
  fontSize: fs(13),
  color: colors.ink,
});
