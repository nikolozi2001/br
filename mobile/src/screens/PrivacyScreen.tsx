import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, EmptyState, HeroGradient, RoundButton } from '../components/primitives';
import { cachedLookup } from '../api/lookupCache';
import { getStrings } from '../i18n/strings';
import { parsePolicy, type PolicyBlock } from '../utils/policyText';
import { useTheme } from '../theme/ThemeProvider';
import type { SettingsScreenProps } from '../navigation/types';

/**
 * Geostat's confidentiality policy, laid out by the app rather than shown in a
 * WebView.
 *
 * The text is fetched instead of shipped with the build — it is the authority's
 * own legal wording, and an embedded copy would go stale the day they revise it
 * — but the *presentation* is ours, so it honours the theme and the font-size
 * setting like every other screen. It is cached alongside the picker lists, so a
 * second visit and an offline one both work.
 *
 * geostat.ge publishes this page only in English; see `privacyEnglishOnly`.
 */

/** The policy sits in `.history-text` and holds only `<p>`; the next `<div>` ends it. */
const POLICY_BODY = /history-text'>(.*?)(?=<div)/s;

async function fetchPolicy(lang: string): Promise<PolicyBlock[]> {
  const response = await fetch(`https://www.geostat.ge/${lang}/page/privacy-policy`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const source = await response.text();
  const body = POLICY_BODY.exec(source)?.[1];
  if (!body) throw new Error('policy body not found');
  return parsePolicy(body);
}

export default function PrivacyScreen({ navigation }: SettingsScreenProps<'Privacy'>) {
  const { colors, fonts, fs, lang, radius } = useTheme();
  const t = getStrings(lang);
  const insets = useSafeAreaInsets();

  const [blocks, setBlocks] = useState<PolicyBlock[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setBlocks(null);
    setFailed(false);

    cachedLookup(`privacy.${lang}`, () => fetchPolicy(lang))
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
          {/* The source has no Georgian translation, so say so rather than let it surprise. */}
          {lang === 'ka' ? (
            <View
              style={{
                backgroundColor: colors.tint.blue10,
                borderRadius: radius.lg,
                paddingVertical: 10,
                paddingHorizontal: 13,
              }}
            >
              <Text style={{ fontSize: fs(12), color: colors.brand, lineHeight: fs(17) }}>
                {t.privacyEnglishOnly}
              </Text>
            </View>
          ) : null}

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
                    <Text style={{ fontSize: fs(15), lineHeight: fs(23), color: colors.brand }}>•</Text>
                    <Text style={{ flex: 1, fontSize: fs(15), lineHeight: fs(23), color: colors.ink }}>
                      {block.text}
                    </Text>
                  </View>
                );
              }
              return (
                <Text key={index} style={{ fontSize: fs(15), lineHeight: fs(23), color: colors.ink }}>
                  {block.text}
                </Text>
              );
            })}
          </Card>
        </ScrollView>
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.brand} />
        </View>
      )}
    </View>
  );
}
