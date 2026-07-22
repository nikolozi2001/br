import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '../components/Icon';
import { EmptyState, HeroGradient, RoundButton } from '../components/primitives';
import { getStrings } from '../i18n/strings';
import { useAppStore } from '../state/AppStore';
import { useSearch } from '../state/SearchStore';
import { useTheme } from '../theme/ThemeProvider';

export default function HistoryScreen({ navigation }) {
  const { colors, fonts, fs, lang, radius, shadow } = useTheme();
  const t = getStrings(lang);
  const insets = useSafeAreaInsets();
  const { recent, clearRecent } = useAppStore();
  const { runSearchWith } = useSearch();

  const repeat = (entry) => {
    runSearchWith({ id: entry.id || '', name: entry.name || '' });
    navigation.navigate('HomeTab', { screen: 'Results' });
  };

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
            <Text style={{ fontFamily: fonts.heading, fontSize: fs(20), color: '#fff', letterSpacing: -0.3 }}>
              {t.searchHistory}
            </Text>
            <Text style={{ fontSize: fs(12), color: 'rgba(255,255,255,0.82)' }}>{t.historyCount(recent.length)}</Text>
          </View>
          {recent.length > 0 ? (
            <Pressable
              onPress={clearRecent}
              style={{
                paddingVertical: 7,
                paddingHorizontal: 13,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.16)',
              }}
            >
              <Text style={{ color: '#fff', fontSize: fs(12.5), fontWeight: '600' }}>{t.clear}</Text>
            </Pressable>
          ) : null}
        </View>
      </HeroGradient>

      <FlatList
        data={recent}
        keyExtractor={(item, index) => `${item.id}-${item.name}-${index}`}
        contentContainerStyle={{ padding: 14, paddingBottom: 108, gap: 10, flexGrow: 1 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => repeat(item)}
            style={({ pressed }) => ({
              backgroundColor: colors.card,
              borderRadius: radius.lg + 2,
              borderWidth: 1,
              borderColor: colors.line,
              paddingVertical: 13,
              paddingHorizontal: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              transform: [{ scale: pressed ? 0.99 : 1 }],
              ...shadow.card,
            })}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: colors.tint.blue09,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="clock" size={18} color={colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ fontSize: fs(15), color: colors.ink, fontWeight: '600' }}>
                {item.name || item.id || t.allSubjects}
              </Text>
              <Text style={{ fontSize: fs(12), color: colors.faint }}>
                {item.id ? `ID: ${item.id}` : t.byName}
              </Text>
            </View>
            <Icon name="chevronRight" size={16} color="#cbd5e1" />
          </Pressable>
        )}
        ListEmptyComponent={<EmptyState icon="clock" title={t.historyEmptyTitle} body={t.historyEmptyBody} />}
      />
    </View>
  );
}
