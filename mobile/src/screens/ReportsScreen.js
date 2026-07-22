import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import ScreenHeader, { FlagChip } from '../components/ScreenHeader';
import Icon from '../components/Icon';
import { REPORTS } from '../data/reports';
import { getStrings } from '../i18n/strings';
import { useTheme } from '../theme/ThemeProvider';

export default function ReportsScreen({ navigation }) {
  const { colors, fonts, fs, lang, radius, shadow } = useTheme();
  const t = getStrings(lang);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title={t.reportsTitle} subtitle={t.reportsSubtitle} actions={<FlagChip lang={lang} />} />

      <FlatList
        data={REPORTS}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 14, paddingBottom: 108, gap: 10 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('ReportDetail', { id: item.id })}
            style={({ pressed }) => ({
              backgroundColor: colors.card,
              borderRadius: radius.lg + 2,
              borderWidth: 1,
              borderColor: colors.line,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              transform: [{ scale: pressed ? 0.99 : 1 }],
              ...shadow.card,
            })}
          >
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                backgroundColor: colors.tint.blue10,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: fonts.heading, fontSize: fs(14), color: colors.brand }}>{item.id}</Text>
            </View>
            <Text style={{ flex: 1, fontSize: fs(14), color: colors.ink, fontWeight: '500', lineHeight: fs(19) }}>
              {item.title[lang] ?? item.title.ka}
            </Text>
            <Icon name="chevronRight" size={16} color="#cbd5e1" />
          </Pressable>
        )}
      />
    </View>
  );
}
