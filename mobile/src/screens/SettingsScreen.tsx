import React from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';

import Icon from '../components/Icon';
import ScreenHeader, { FlagChip } from '../components/ScreenHeader';
import { Segmented } from '../components/Field';
import { Card, SectionLabel, Toggle } from '../components/primitives';
import { API_BASE_URL } from '../api/client';
import { getStrings } from '../i18n/strings';
import { useAppStore } from '../state/AppStore';
import { useTheme } from '../theme/ThemeProvider';
import type { SettingsScreenProps } from '../navigation/types';
import type { FontSize, Lang } from '../types';

function Row({ children, last = false, onPress }: { children: React.ReactNode; last?: boolean; onPress?: () => void }) {
  const { colors } = useTheme();
  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingVertical: 13,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.line3,
      }}
    >
      {children}
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{content}</Pressable> : content;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps<'SettingsRoot'>) {
  const { colors, fonts, fs, lang, settings, update } = useTheme();
  const t = getStrings(lang);
  const { recent } = useAppStore();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title={t.settingsTitle} subtitle={t.settingsSubtitle} />

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 108, gap: 20 }}>
        {/* Language */}
        <View style={{ gap: 8 }}>
          <SectionLabel>{t.language}</SectionLabel>
          <Card style={{ overflow: 'hidden' }}>
            {([
              { value: 'ka', label: t.georgian },
              { value: 'en', label: t.english },
            ] as { value: Lang; label: string }[]).map((option, index) => (
              <Pressable
                key={option.value}
                onPress={() => update({ lang: option.value })}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 13,
                  paddingHorizontal: 15,
                  borderBottomWidth: index === 0 ? 1 : 0,
                  borderBottomColor: colors.line3,
                  backgroundColor: pressed ? colors.field : 'transparent',
                })}
              >
                <View style={{ borderRadius: 5, overflow: 'hidden', borderWidth: 1, borderColor: colors.line2 }}>
                  <FlagChip lang={option.value} width={33} height={22} />
                </View>
                <Text style={{ flex: 1, fontSize: fs(15), color: colors.ink }}>{option.label}</Text>
                {lang === option.value ? <Icon name="check" size={20} color={colors.brand} width={2.5} /> : null}
              </Pressable>
            ))}
          </Card>
        </View>

        {/* Appearance */}
        <View style={{ gap: 8 }}>
          <SectionLabel>{t.appearance}</SectionLabel>
          <Card style={{ paddingHorizontal: 15, paddingVertical: 2 }}>
            <Row>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon name="moon" size={19} color="#475569" />
                <Text style={{ fontSize: fs(15), color: colors.ink }}>{t.theme}</Text>
              </View>
              <Segmented
                value={settings.themeMode}
                onChange={(v) => update({ themeMode: v })}
                options={[
                  { value: 'system', label: t.themeSystem },
                  { value: 'light', label: t.themeLight },
                  { value: 'dark', label: t.themeDark },
                ]}
              />
            </Row>
            <Row last>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontFamily: fonts.heading, fontSize: fs(15), color: '#475569' }}>A</Text>
                <Text style={{ fontSize: fs(15), color: colors.ink }}>{t.fontSize}</Text>
              </View>
              <Segmented
                small
                value={settings.fontSize}
                onChange={(v) => update({ fontSize: v })}
                options={[
                  { value: 'small', label: 'A-', size: 13 },
                  { value: 'normal', label: 'A', size: 14 },
                  { value: 'large', label: 'A+', size: 16 },
                ]}
              />
            </Row>
          </Card>
        </View>

        {/* Search */}
        <View style={{ gap: 8 }}>
          <SectionLabel>{t.searchSection}</SectionLabel>
          <Card style={{ paddingHorizontal: 15, paddingVertical: 2 }}>
            <Row>
              <Text style={{ fontSize: fs(15), color: colors.ink, flex: 1 }}>{t.saveHistory}</Text>
              <Toggle value={settings.saveHistory} onChange={(v) => update({ saveHistory: v })} />
            </Row>
            <Row last onPress={() => navigation.navigate('History')}>
              <Text style={{ fontSize: fs(15), color: colors.ink }}>{t.searchHistory}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: fs(13), color: colors.faint }}>{t.historyCount(recent.length)}</Text>
                <Icon name="chevronRight" size={16} color="#cbd5e1" />
              </View>
            </Row>
          </Card>
        </View>

        {/* About */}
        <View style={{ gap: 8 }}>
          <SectionLabel>{t.about}</SectionLabel>
          <Card style={{ paddingHorizontal: 15, paddingVertical: 2 }}>
            <Row>
              <Text style={{ fontSize: fs(15), color: colors.ink }}>{t.version}</Text>
              <Text style={{ fontSize: fs(14), color: colors.faint }}>1.0.0</Text>
            </Row>
            <Row onPress={() => Linking.openURL('https://geostat.ge')}>
              <Text style={{ fontSize: fs(15), color: colors.ink }}>{t.dataSource}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: fs(14), color: colors.brand }}>geostat.ge</Text>
                <Icon name="external" size={15} color={colors.brand} />
              </View>
            </Row>
            <Row last>
              <Text style={{ fontSize: fs(15), color: colors.ink, flex: 1 }}>API</Text>
              <Text style={{ fontSize: fs(12), color: colors.faint }} numberOfLines={1}>
                {API_BASE_URL.replace(/^https?:\/\//, '')}
              </Text>
            </Row>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}
