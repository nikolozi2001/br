import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from './Icon';
import { EmptyState, HeroGradient } from './primitives';
import { fetchPersonInvolvement } from '../api/registry';
import { getStrings } from '../i18n/strings';
import { useTheme } from '../theme/ThemeProvider';
import type { PersonInvolvementRow } from '../types';

type Status = 'loading' | 'error' | 'done';

export interface PersonInvolvementSheetProps {
  visible: boolean;
  onClose: () => void;
  /** The person to look up; the sheet only fetches when this is set. */
  personId: number | null;
  personName: string;
}

/**
 * Modal listing every company a person is (or was) involved in, from
 * `/api/legal-unit-web?personId=` — the app's take on the web involvement popup.
 */
export default function PersonInvolvementSheet({ visible, onClose, personId, personName }: PersonInvolvementSheetProps) {
  const { colors, fonts, fs, lang, radius, shadow } = useTheme();
  const t = getStrings(lang);
  const insets = useSafeAreaInsets();

  const [status, setStatus] = useState<Status>('loading');
  const [rows, setRows] = useState<PersonInvolvementRow[]>([]);

  useEffect(() => {
    if (!visible || personId == null) return;
    let cancelled = false;
    setStatus('loading');
    setRows([]);
    fetchPersonInvolvement(personId, lang)
      .then((data) => {
        if (cancelled) return;
        setRows(data);
        setStatus('done');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [visible, personId, lang]);

  const retry = () => {
    if (personId == null) return;
    setStatus('loading');
    fetchPersonInvolvement(personId, lang)
      .then((data) => {
        setRows(data);
        setStatus('done');
      })
      .catch(() => setStatus('error'));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={{ flex: 1, backgroundColor: colors.scrimStrong }} onPress={onClose} />
      <View
        style={{
          position: 'absolute',
          left: 8,
          right: 8,
          bottom: Math.max(insets.bottom, 8),
          maxHeight: '78%',
        }}
      >
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: radius['2xl'],
            overflow: 'hidden',
            flexShrink: 1,
            ...shadow.sheet,
          }}
        >
          <HeroGradient>
            <View
              style={{
                paddingVertical: 16,
                paddingHorizontal: 18,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontFamily: fonts.heading, fontSize: fs(18), color: '#fff', lineHeight: fs(23) }}
                  numberOfLines={2}
                >
                  {personName}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: fs(12), marginTop: 2 }}>
                  {t.involvementList}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={10}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="close" size={18} color="#fff" />
              </Pressable>
            </View>
          </HeroGradient>

          {status === 'loading' ? (
            <View style={{ paddingVertical: 48, alignItems: 'center' }}>
              <ActivityIndicator color={colors.brand} />
            </View>
          ) : status === 'error' ? (
            <View style={{ padding: 24 }}>
              <EmptyState
                icon="refresh"
                title={t.networkError}
                body={t.emptyBody}
                actionLabel={t.retry}
                onAction={retry}
                size={72}
              />
            </View>
          ) : rows.length === 0 ? (
            <View style={{ padding: 24 }}>
              <EmptyState icon="emptyReport" title={t.involvementEmpty} body="" size={72} />
            </View>
          ) : (
            <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
              {rows.map((r, i) => (
                <View
                  key={`${r.statId}-${r.role}-${r.date}-${i}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    paddingVertical: 14,
                    paddingHorizontal: 18,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: colors.line3,
                  }}
                >
                  <View style={{ gap: 2, flex: 1 }}>
                    <Text style={{ fontSize: fs(15), color: colors.brand, fontWeight: '600' }}>{r.company}</Text>
                    <Text style={{ fontSize: fs(12), color: colors.muted }}>{r.role}</Text>
                  </View>
                  <Text style={{ fontSize: fs(12), color: colors.faint }}>{r.date}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
