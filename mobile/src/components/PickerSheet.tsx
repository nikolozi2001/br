import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import BottomSheet from './BottomSheet';
import Icon from './Icon';
import type { Option } from '../types';

/**
 * Multi-select option sheet. Tapping a row toggles it and leaves the sheet open,
 * so several values can be picked in one go; the sheet closes from "Done" or the
 * scrim. Lists come from the backend lookup endpoints and can be long (NACE
 * codes, municipalities), so anything over 12 rows gets a filter box.
 */
export interface PickerSheetProps {
  visible: boolean;
  title: string;
  options: Option[];
  selected: Option[];
  onToggle: (option: Option) => void;
  onClear: () => void;
  onClose: () => void;
  doneLabel: string;
  clearLabel: string;
  selectedLabel: (n: number) => string;
  searchPlaceholder: string;
}

export default function PickerSheet({
  visible,
  title,
  options,
  selected,
  onToggle,
  onClear,
  onClose,
  doneLabel,
  clearLabel,
  selectedLabel,
  searchPlaceholder,
}: PickerSheetProps) {
  const { colors, fs, radius } = useTheme();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const selectedValues = useMemo(() => new Set(selected.map((o) => o.value)), [selected]);
  const showFilter = options.length > 12;

  const close = () => {
    setQuery('');
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={close} title={title} cancelLabel={doneLabel} scroll>
      {showFilter ? (
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={searchPlaceholder}
          placeholderTextColor="#9aa7b5"
          style={{
            height: 42,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.line2,
            backgroundColor: colors.card,
            paddingHorizontal: 13,
            marginBottom: 6,
            marginHorizontal: 2,
            fontSize: fs(15),
            color: colors.ink,
          }}
        />
      ) : null}

      {selected.length > 0 ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 12,
            paddingBottom: 8,
          }}
        >
          <Text style={{ fontSize: fs(12), color: colors.muted, fontWeight: '600' }}>
            {selectedLabel(selected.length)}
          </Text>
          <Pressable onPress={onClear} hitSlop={8}>
            <Text style={{ fontSize: fs(12), color: colors.red, fontWeight: '600' }}>{clearLabel}</Text>
          </Pressable>
        </View>
      ) : null}

      {filtered.map((option) => {
        const isCurrent = selectedValues.has(option.value);
        return (
          <Pressable
            key={option.value}
            onPress={() => onToggle(option)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 13,
              paddingHorizontal: 12,
              borderRadius: radius.lg,
              backgroundColor: pressed ? colors.field : 'transparent',
            })}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                borderWidth: isCurrent ? 0 : 1.5,
                borderColor: colors.line2,
                backgroundColor: isCurrent ? colors.brand : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isCurrent ? <Icon name="check" size={15} color="#fff" width={2.6} /> : null}
            </View>
            <Text
              style={{
                fontSize: fs(15),
                flex: 1,
                color: isCurrent ? colors.brand : colors.ink,
                fontWeight: isCurrent ? '600' : '500',
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </BottomSheet>
  );
}
