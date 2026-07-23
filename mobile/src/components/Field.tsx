import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import Icon from './Icon';

/** Labelled 44px text input (`.brinput`). */
export function TextField({ label, value, onChangeText, placeholder, keyboardType, style }) {
  const { colors, fs, radius } = useTheme();
  return (
    <View style={[{ gap: 6 }, style]}>
      <Text style={{ fontSize: fs(12), color: colors.muted, fontWeight: '600' }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9aa7b5"
        keyboardType={keyboardType}
        style={{
          height: 44,
          borderWidth: 1,
          borderColor: colors.line2,
          borderRadius: radius.lg - 1,
          paddingHorizontal: 13,
          fontSize: fs(15),
          color: colors.ink,
          backgroundColor: colors.card,
        }}
      />
    </View>
  );
}

/** Labelled select that opens a PickerSheet; shows placeholder text when unset. */
export function SelectField({ label, value, placeholder, onPress, style, compact = false }) {
  const { colors, fs, radius } = useTheme();
  const hasValue = Boolean(value);
  return (
    <View style={[{ gap: 6 }, style]}>
      <Text style={{ fontSize: fs(12), color: colors.muted, fontWeight: '600' }}>{label}</Text>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          height: 44,
          borderWidth: 1,
          borderColor: colors.line2,
          borderRadius: radius.lg - 1,
          paddingHorizontal: compact ? 12 : 13,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: pressed ? colors.field : colors.card,
        })}
      >
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontSize: fs(compact ? 14 : 15),
            color: hasValue ? colors.ink : '#9aa7b5',
          }}
        >
          {hasValue ? value : placeholder}
        </Text>
        <Icon name="chevronDown" size={compact ? 15 : 16} color="#94a3b8" />
      </Pressable>
    </View>
  );
}

/** Two-option segmented pill (legal / factual address, font size). */
export function Segmented({ options, value, onChange, small = false }) {
  const { colors, fs } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: small ? colors.field : colors.line2,
        borderRadius: small ? 10 : 999,
        padding: small ? 3 : 2,
        gap: small ? 2 : 0,
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={{
              paddingVertical: small ? 0 : 4,
              paddingHorizontal: small ? 0 : 12,
              width: small ? 36 : undefined,
              height: small ? 30 : undefined,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: small ? 8 : 999,
              backgroundColor: selected ? '#fff' : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: fs(option.size ?? 12),
                fontWeight: small ? '700' : '600',
                color: selected ? colors.brand : colors.muted,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
