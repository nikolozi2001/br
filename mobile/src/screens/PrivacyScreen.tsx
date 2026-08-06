import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '../components/Icon';
import { Card, EmptyState, HeroGradient, RoundButton } from '../components/primitives';
import { cachedLookup } from '../api/lookupCache';
import { getStrings } from '../i18n/strings';
import { POLICY_KA_EDITION, POLICY_KA_SOURCE, policyKa } from '../data/policyKa';
import { parsePolicy, type PolicyBlock } from '../utils/policyText';
import { useTheme } from '../theme/ThemeProvider';
import type { SettingsScreenProps } from '../navigation/types';

/**
 * Geostat's confidentiality policy, laid out by the app rather than shown in a
 * WebView: the wording is theirs, the presentation ours, so it honours the theme
 * and the font-size setting like every other screen.
 *
 * The two languages reach that layout by different routes, because Geostat
 * publishes them differently. English is fetched from their page — an embedded
 * copy would go stale the day they revise it — and cached alongside the picker
 * lists, so a second visit and an offline one both work. Georgian exists only as
 * a PDF, which the app cannot lay out, so it ships with the build; see
 * {@link policyKa}.
 */

/** The policy sits in `.history-text` and holds only `<p>`; the next `<div>` ends it. */
const POLICY_BODY = /history-text'>(.*?)(?=<div)/s;

/** The `/ka/` path of this page serves the English body too, so it is not localised. */
const POLICY_EN_PAGE = 'https://www.geostat.ge/en/page/privacy-policy';

async function fetchPolicy(): Promise<PolicyBlock[]> {
  const response = await fetch(POLICY_EN_PAGE);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  const body = POLICY_BODY.exec(html)?.[1];
  if (!body) throw new Error('policy body not found');
  return parsePolicy(body);
}

export default function PrivacyScreen({ navigation }: SettingsScreenProps<'Privacy'>) {
  const { colors, fonts, fs, lang, radius } = useTheme();
  const t = getStrings(lang);
  const insets = useSafeAreaInsets();

  const source =
    lang === 'ka'
      ? { url: POLICY_KA_SOURCE, label: `geostat.ge · ${POLICY_KA_EDITION}` }
      : { url: POLICY_EN_PAGE, label: 'geostat.ge' };

  /**
   * No `lineHeight` — a fixed one loses trailing lines of Georgian text. With
   * `lineHeight: 23` at font size 15 the staff-obligations principle ended one
   * line early: the closing line was laid out but painted onto the previous one,
   * past the card, where it was clipped. It reappeared at the large font size and
   * went away for good once the leading was left to the system, which is the only
   * one that knows what these glyphs need.
   */
  const body = { fontSize: fs(15), color: colors.ink };

  // Georgian is in the bundle, so it is there on the first frame and never fails.
  const [blocks, setBlocks] = useState<PolicyBlock[] | null>(lang === 'ka' ? policyKa : null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (lang === 'ka') {
      setBlocks(policyKa);
      setFailed(false);
      return;
    }

    let cancelled = false;
    setBlocks(null);
    setFailed(false);

    cachedLookup('privacy.en', fetchPolicy)
      .then((result) => {
        if (!cancelled) setBlocks(result);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [lang]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <HeroGradient>
        <View
          style={{
            paddingTop: insets.top + 12,
            paddingHorizontal: 16,
            paddingBottom: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <RoundButton icon="back" color="#fff" background="rgba(255,255,255,0.16)" onPress={() => navigation.goBack()} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.heading, fontSize: fs(18), color: '#fff' }}>{t.privacy}</Text>
            <Text style={{ fontSize: fs(12), color: 'rgba(255,255,255,0.82)' }}>geostat.ge</Text>
          </View>
        </View>
      </HeroGradient>

      {failed ? (
        <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
          <EmptyState icon="search" title={t.networkError} body={t.privacyOffline} />
        </View>
      ) : blocks ? (
        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 32 + insets.bottom, gap: 10 }}>
          <Card style={{ padding: 16, gap: 12 }}>
            {blocks.map((block, index) => {
              if (block.kind === 'heading') {
                return (
                  <Text
                    key={index}
                    style={{ fontFamily: fonts.heading, fontSize: fs(17), color: colors.brand }}
                  >
                    {block.text}
                  </Text>
                );
              }
              if (block.kind === 'bullet') {
                return (
                  <View key={index} style={{ flexDirection: 'row', gap: 9, paddingLeft: 2 }}>
                    <Text style={[body, { color: colors.brand }]}>•</Text>
                    <Text style={[body, { flex: 1 }]}>{block.text}</Text>
                  </View>
                );
              }
              return (
                <Text key={index} style={body}>
                  {block.text}
                </Text>
              );
            })}
          </Card>

          {/* Ours is a copy of their document; keep the way back to it in reach. */}
          <Pressable
            onPress={() => Linking.openURL(source.url).catch(() => undefined)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 10,
              paddingHorizontal: 13,
              backgroundColor: colors.tint.blue10,
              borderRadius: radius.lg,
            }}
          >
            <Text style={{ fontSize: fs(12), color: colors.brand, lineHeight: fs(17) }}>
              {t.privacySource(source.label)}
            </Text>
            <Icon name="external" size={14} color={colors.brand} />
          </Pressable>
        </ScrollView>
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.brand} />
        </View>
      )}
    </View>
  );
}
