import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, HeroGradient, RoundButton } from '../components/primitives';
import { getStrings } from '../i18n/strings';
import { useTheme } from '../theme/ThemeProvider';
import type { SettingsScreenProps } from '../navigation/types';

/**
 * Geostat's confidentiality policy, read inside the app rather than handed to
 * the browser.
 *
 * The text is fetched from geostat.ge rather than shipped with the build: it is
 * the authority's own legal wording, and a copy embedded here would quietly go
 * out of date the day they revise it.
 *
 * Only the policy itself is pulled out of the page and re-rendered in a document
 * of our own, so it reads as a screen rather than a website in a box. Injecting
 * CSS into their page was tried first and did not run at all; extracting the
 * text avoids depending on the WebView's injection timing, their content
 * security policy, and the chat widget they float over the corner.
 */

/** The policy sits in `.history-text` and holds only `<p>`; the next `<div>` ends it. */
const POLICY_BODY = /history-text'>(.*?)(?=<div)/s;

/**
 * The list bullets come through as U+F0B7 — the Wingdings glyph Word leaves
 * behind when text is pasted from it. Without that font it draws as an empty
 * box, so it becomes a real bullet.
 */
const fixWordBullets = (html: string): string => html.replace(/\uF0B7/g, '\u2022');

const page = (body: string): string => `<!doctype html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>
  body { margin: 0; padding: 18px 16px 36px; background: #fff;
         font-family: -apple-system, system-ui, sans-serif;
         font-size: 15px; line-height: 1.65; color: #1a1a2e; }
  p { margin: 0 0 14px; }
  a { color: #0080be; }
</style>
</head><body>${body}</body></html>`;

export default function PrivacyScreen({ navigation }: SettingsScreenProps<'Privacy'>) {
  const { colors, fonts, fs, lang } = useTheme();
  const t = getStrings(lang);
  const insets = useSafeAreaInsets();

  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setHtml(null);
    setFailed(false);

    fetch(`https://www.geostat.ge/${lang}/page/privacy-policy`)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then((source) => {
        if (cancelled) return;
        const body = POLICY_BODY.exec(source)?.[1];
        // A redesign could move the text; better to show the whole page than nothing.
        setHtml(body ? page(fixWordBullets(body)) : source);
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
      ) : html ? (
        <WebView
          source={{ html, baseUrl: 'https://www.geostat.ge/' }}
          style={{ flex: 1, backgroundColor: '#fff' }}
        />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.brand} />
        </View>
      )}
    </View>
  );
}
