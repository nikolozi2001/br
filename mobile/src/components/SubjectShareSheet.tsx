import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import Icon from './Icon';
import { GeostatLogo } from './ScreenHeader';
import { HeroGradient } from './primitives';
import { formatLongDate } from '../api/registry';
import { getStrings } from '../i18n/strings';
import { useAppStore } from '../state/AppStore';
import { useTheme } from '../theme/ThemeProvider';
import type { Strings } from '../i18n/strings';
import type { Lang, Subject } from '../types';

const escapeHtml = (value: unknown): string =>
  String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function summaryHtml(subject: Subject, t: Strings, lang: Lang): string {
  const rows = [
    [t.idLabel, subject.id],
    [t.legalCode, subject.code],
    [t.legalFormFull, subject.formFull],
    [t.status, subject.active ? t.active : t.inactive],
    [t.head, subject.head],
    [t.activity, [subject.nace, subject.naceName].filter(Boolean).join(' · ')],
    [t.address, [subject.addr, subject.region].filter(Boolean).join(', ')],
    [t.registration, formatLongDate(subject.regDate, lang)],
  ];
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:-apple-system,system-ui,sans-serif;padding:28px;color:#1a1a2e}
    h1{font-size:20px;margin:0 0 4px;color:#0080be}
    .sub{font-size:12px;color:#64748b;margin-bottom:20px}
    table{border-collapse:collapse;width:100%;font-size:12px}
    td{padding:8px 0;border-bottom:1px solid #f0f3f7;vertical-align:top}
    td.k{color:#64748b;width:38%}
    td.v{font-weight:600;text-align:right}
  </style></head><body>
    <h1>${escapeHtml(subject.name)}</h1>
    <div class="sub">${escapeHtml(t.appOwner)} — ${escapeHtml(t.appName)}</div>
    <table>${rows
      .map(([k, v]) => `<tr><td class="k">${escapeHtml(k)}</td><td class="v">${escapeHtml(v || '—')}</td></tr>`)
      .join('')}</table>
  </body></html>`;
}

function Line({ label, value, valueColor }: { label: string; value?: string; valueColor?: string }) {
  const { colors, fs } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Text style={{ fontSize: fs(12.5), color: colors.muted }}>{label}</Text>
      <Text
        style={{ fontSize: fs(12.5), color: valueColor || colors.ink, fontWeight: '500', textAlign: 'right', flexShrink: 1 }}
      >
        {value || '—'}
      </Text>
    </View>
  );
}

/** Preview card for the subject's PDF summary, with share + print actions. */
export interface SubjectShareSheetProps {
  visible: boolean;
  onClose: () => void;
  subject: Subject;
}

export default function SubjectShareSheet({ visible, onClose, subject }: SubjectShareSheetProps) {
  const { colors, fonts, fs, lang, radius, shadow } = useTheme();
  const t = getStrings(lang);
  const insets = useSafeAreaInsets();
  const { showToast } = useAppStore();

  const sharePdf = async () => {
    onClose();
    showToast(t.preparingPdf);
    try {
      const { uri } = await Print.printToFileAsync({ html: summaryHtml(subject, t, lang) });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
    } catch (err) {
      showToast((err as Error)?.message || t.networkError);
    }
  };

  const print = async () => {
    onClose();
    showToast(t.openingPrint);
    try {
      await Print.printAsync({ html: summaryHtml(subject, t, lang) });
    } catch (err) {
      showToast((err as Error)?.message || t.networkError);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={{ flex: 1, backgroundColor: colors.scrimStrong }} onPress={onClose} />
      <View style={{ position: 'absolute', left: 8, right: 8, bottom: Math.max(insets.bottom, 8), gap: 10 }}>
        <View style={{ backgroundColor: colors.card, borderRadius: radius['2xl'], overflow: 'hidden', ...shadow.sheet }}>
          <HeroGradient>
            <View
              style={{
                paddingVertical: 16,
                paddingHorizontal: 18,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <GeostatLogo height={22} />
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: fs(11), fontWeight: '600', letterSpacing: 0.44 }}>
                {t.pdfSummary}
              </Text>
            </View>
          </HeroGradient>

          <View style={{ padding: 18, gap: 12 }}>
            <View>
              <Text style={{ fontFamily: fonts.heading, fontSize: fs(19), color: colors.ink, lineHeight: fs(24) }}>
                {subject.name}
              </Text>
              <Text style={{ fontSize: fs(12), color: colors.muted, marginTop: 3 }}>
                {t.idLabel} <Text style={{ color: colors.brand, fontWeight: '600' }}>{subject.id}</Text>
                {subject.formFull ? ` · ${subject.formFull}` : ''}
              </Text>
            </View>

            <View style={{ height: 1, backgroundColor: colors.line }} />

            <View style={{ gap: 9 }}>
              <Line
                label={t.status}
                value={subject.active ? t.active : t.inactive}
                valueColor={subject.active ? colors.greenDark : colors.red}
              />
              <Line label={t.head} value={subject.head} />
              <Line label={t.activity} value={[subject.nace, subject.naceName].filter(Boolean).join(' · ')} />
              <Line label={t.address} value={[subject.addr, subject.region].filter(Boolean).join(', ')} />
              <Line label={t.registration} value={formatLongDate(subject.regDate, lang)} />
            </View>

            <View style={{ flexDirection: 'row', gap: 9, marginTop: 4 }}>
              <Pressable
                onPress={sharePdf}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 44,
                  borderRadius: radius.lg,
                  backgroundColor: colors.brand,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Icon name="share" size={16} color="#fff" />
                <Text style={{ fontFamily: fonts.heading, fontSize: fs(14), color: '#fff' }}>{t.sharePdf}</Text>
              </Pressable>
              <Pressable
                onPress={print}
                style={({ pressed }) => ({
                  width: 44,
                  height: 44,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: '#cdd8e3',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Icon name="printer" size={19} color="#475569" />
              </Pressable>
            </View>
          </View>
        </View>

        <Pressable
          onPress={onClose}
          style={{ backgroundColor: colors.chrome, borderRadius: radius.xl, padding: 15, alignItems: 'center' }}
        >
          <Text style={{ fontFamily: fonts.heading, fontSize: fs(16), color: colors.brand }}>{t.cancel}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
