import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';

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
/** A row that picks a whole group at once ("select all", "select business entities"). */
export interface PickerAction {
  key: string;
  label: string;
  /** True when the picked set is exactly this group — tapping then clears it. */
  active: boolean;
  onPress: () => void;
}

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
  actions?: PickerAction[];
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
  actions = [],
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

  const keyExtractor = useCallback((option: Option) => option.value, []);

  const renderOption = useCallback(
    ({ item }: { item: Option }) => {
      const isCurrent = selectedValues.has(item.value);
      return (
        <Pressable
          onPress={() => onToggle(item)}
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
            {item.label}
          </Text>
        </Pressable>
      );
    },
    [colors, fs, onToggle, radius, selectedValues],
  );

  // No `scroll` on the sheet: its body must not be a ScrollView, or the FlatList
  // below would be nested in one and lose its virtualisation.
  return (
    <BottomSheet visible={visible} onClose={close} title={title} cancelLabel={doneLabel}>
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

      {/* Group actions sit above the list and stay put while the list is filtered. */}
      {actions.map((action) => (
        <Pressable
          key={action.key}
          onPress={action.onPress}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingVertical: 12,
            paddingHorizontal: 12,
            borderRadius: radius.lg,
            backgroundColor: action.active ? colors.field : pressed ? colors.field : 'transparent',
          })}
        >
          <Icon name="check" size={17} color={colors.brand} width={2.6} />
          <Text style={{ fontSize: fs(15), flex: 1, color: colors.brand, fontWeight: '600' }}>
            {action.label}
          </Text>
        </Pressable>
      ))}
      {actions.length > 0 ? (
        <View style={{ height: 1, backgroundColor: colors.line, marginVertical: 6, marginHorizontal: 12 }} />
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

      {/* The NACE list is ~1700 rows, so the options are virtualised. Everything
          above stays outside the list, where filtering cannot scroll it away. */}
      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderOption}
        extraData={selectedValues}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={14}
        windowSize={7}
        removeClippedSubviews
        style={{ maxHeight: 320 }}
      />
    </BottomSheet>
  );
}
