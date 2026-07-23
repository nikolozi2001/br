import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../theme/ThemeProvider';
import Icon from './Icon';

/** Blue gradient used by every screen header. */
export function HeroGradient({ children, style }) {
  const { colors } = useTheme();
  return (
    <LinearGradient
      colors={[colors.brand, colors.brandHover]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}

/** The small uppercase blue label that heads every card group. */
export function SectionLabel({ children, style }) {
  const { colors, fonts, fs } = useTheme();
  return (
    <Text
      style={[
        { fontFamily: fonts.heading, fontSize: fs(13), color: colors.brand, letterSpacing: 0.26, paddingHorizontal: 6 },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/** White rounded surface with the design system's 1px border + soft shadow. */
export const Card = React.forwardRef(function Card({ children, style, radius: r, ...rest }, ref) {
  const { colors, radius, shadow } = useTheme();
  return (
    <View
      ref={ref}
      {...rest}
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: r ?? radius.xl,
          borderWidth: 1,
          borderColor: colors.line,
          ...shadow.card,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
});

/** `label ................ value` row inside a detail card. */
export function DataRow({ label, value, last = false, valueColor }) {
  const { colors, fs } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 14,
        paddingVertical: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.line3,
      }}
    >
      <Text style={{ fontSize: fs(13), color: colors.muted, flexShrink: 0 }}>{label}</Text>
      <Text
        style={{
          fontSize: fs(14),
          color: valueColor || colors.ink,
          fontWeight: '500',
          textAlign: 'right',
          flexShrink: 1,
        }}
      >
        {value || '—'}
      </Text>
    </View>
  );
}

/** iOS-style switch matching the prototype's 46×28 pill. */
export function Toggle({ value, onChange }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={{
        width: 46,
        height: 28,
        borderRadius: 999,
        backgroundColor: value ? colors.brand : '#cbd5e1',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 2,
          left: value ? 20 : 2,
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: '#fff',
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 1 },
          elevation: 2,
        }}
      />
    </Pressable>
  );
}

/** Circular header button (back, favourite, share). */
export function RoundButton({ icon, onPress, background, color, elevated = false, children }) {
  const { shadow } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        {
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: background,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.7 : 1,
        },
        elevated && shadow.raised,
      ]}
    >
      {children ?? <Icon name={icon} size={17} color={color} />}
    </Pressable>
  );
}

/** Centred illustration + title + body used by every empty state. */
export function EmptyState({ icon, title, body, size = 92 }) {
  const { colors, fonts, fs } = useTheme();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', gap: 14, paddingVertical: 56, paddingHorizontal: 30 }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.tint.blue10,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={38} color={colors.brand} width={1.8} />
      </View>
      <Text style={{ fontFamily: fonts.heading, fontSize: fs(17), color: colors.ink, textAlign: 'center' }}>{title}</Text>
      <Text style={{ fontSize: fs(14), color: colors.muted, lineHeight: fs(21), textAlign: 'center', maxWidth: 240 }}>
        {body}
      </Text>
    </View>
  );
}

/** Shimmerless placeholder block — a flat tinted bar while data loads. */
export function Skeleton({ width, height = 12, radius = 6, tone = 'line', style }) {
  const { colors } = useTheme();
  return (
    <View
      style={[{ width, height, borderRadius: radius, backgroundColor: tone === 'field' ? colors.field : colors.line }, style]}
    />
  );
}

export const row = StyleSheet.create({
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  center: { flexDirection: 'row', alignItems: 'center' },
});
