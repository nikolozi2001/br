import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme, type ThemeColors } from '../theme/ThemeProvider';
import Icon from './Icon';
import type { Subject } from '../types';

/**
 * Result / favourite row card. `სს` (joint-stock) gets the red accent badge,
 * everything else the brand blue one — same rule as the prototype's `badge()`.
 */
export function badgeColor(form: string, colors: ThemeColors): string {
  return form === 'სს' || form === 'JSC' ? colors.redDark : colors.brand;
}

export default function SubjectCard({ subject, onPress }: { subject: Subject; onPress: () => void }) {
  const { colors, fs, radius, shadow } = useTheme();
  const accent = badgeColor(subject.form, colors);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: colors.card,
          borderRadius: radius.lg + 2,
          borderWidth: 1,
          borderColor: colors.line,
          paddingVertical: 13,
          paddingHorizontal: 14,
          gap: 7,
          transform: [{ scale: pressed ? 0.99 : 1 }],
          ...shadow.card,
        },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.muted, fontWeight: '600', fontSize: fs(13) }}>{subject.id}</Text>
        {subject.form ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: accent }} />
            <Text style={{ color: accent, fontSize: fs(11), fontWeight: '600' }}>{subject.form}</Text>
          </View>
        ) : null}
      </View>

      <Text style={{ fontSize: fs(16.5), color: colors.ink, fontWeight: '700', lineHeight: fs(21.5) }}>
        {subject.name}
      </Text>

      <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap' }}>
        {subject.code ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Icon name="card" size={13} color={colors.faint} />
            <Text style={{ color: colors.faint, fontSize: fs(12) }}>{subject.code}</Text>
          </View>
        ) : null}
        {subject.region ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Icon name="pin" size={13} color={colors.faint} />
            <Text style={{ color: colors.faint, fontSize: fs(12) }}>{subject.region}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
