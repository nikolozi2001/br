import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import BottomSheet from './BottomSheet';
import Icon from './Icon';

/**
 * Option picker sheet. Lists come from the backend lookup endpoints and can be
 * long (NACE codes, municipalities), so anything over 12 rows gets a filter box.
 */
export default function PickerSheet({ visible, title, options, selected, onSelect, onClose, cancelLabel, searchPlaceholder }) {
  const { colors, fs, radius } = useTheme();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const showFilter = options.length > 12;

  return (
    <BottomSheet
      visible={visible}
      onClose={() => {
        setQuery('');
        onClose();
      }}
      title={title}
      cancelLabel={cancelLabel}
      scroll
    >
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

      {filtered.map((option) => {
        const isCurrent = (selected?.value ?? selected?.label) === (option.value ?? option.label);
        return (
          <Pressable
            key={String(option.value ?? option.label)}
            onPress={() => {
              setQuery('');
              onSelect(option);
            }}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              paddingVertical: 13,
              paddingHorizontal: 12,
              borderRadius: radius.lg,
              backgroundColor: pressed ? colors.field : 'transparent',
            })}
          >
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
            {isCurrent ? <Icon name="check" size={19} color={colors.brand} width={2.5} /> : null}
          </Pressable>
        );
      })}
    </BottomSheet>
  );
}
