import React from 'react';
import { FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import SubjectCard from '../components/SubjectCard';
import { EmptyState, RoundButton } from '../components/primitives';
import { getStrings } from '../i18n/strings';
import { useAppStore } from '../state/AppStore';
import { useTheme } from '../theme/ThemeProvider';

export default function FavouritesScreen({ navigation }) {
  const { colors, dark, fonts, fs, lang } = useTheme();
  const t = getStrings(lang);
  const insets = useSafeAreaInsets();
  const { favouriteList } = useAppStore();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          backgroundColor: dark ? colors.card : '#eef6fb',
          borderBottomWidth: 1,
          borderBottomColor: colors.line2,
          paddingTop: insets.top + 12,
          paddingHorizontal: 16,
          paddingBottom: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <RoundButton icon="back" color="#475569" background={colors.field} onPress={() => navigation.goBack()} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.heading, fontSize: fs(20), color: colors.ink, letterSpacing: -0.3 }}>
            {t.favTitle}
          </Text>
          <Text style={{ fontSize: fs(12), color: colors.muted }}>{t.favCount(favouriteList.length)}</Text>
        </View>
      </View>

      <FlatList
        data={favouriteList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 14, paddingBottom: 108, gap: 11, flexGrow: 1 }}
        renderItem={({ item }) => (
          <SubjectCard subject={item} onPress={() => navigation.navigate('Detail', { subject: item })} />
        )}
        ListEmptyComponent={<EmptyState icon="heart" title={t.favEmptyTitle} body={t.favEmptyBody} size={104} />}
      />
    </View>
  );
}
