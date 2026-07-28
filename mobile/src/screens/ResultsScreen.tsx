import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ExportSheet from '../components/ExportSheet';
import Icon from '../components/Icon';
import SubjectCard from '../components/SubjectCard';
import { Card, EmptyState, HeroGradient, RoundButton, Skeleton } from '../components/primitives';
import { groupDigits } from '../api/registry';
import { getStrings } from '../i18n/strings';
import { useSearch } from '../state/SearchStore';
import { useTheme } from '../theme/ThemeProvider';
import type { HomeScreenProps } from '../navigation/types';
import type { SortKey } from '../types';
import type { Strings } from '../i18n/strings';

const SORTS: { key: SortKey; labelKey: keyof Strings }[] = [
  { key: 'name', labelKey: 'sortName' },
  { key: 'id', labelKey: 'sortId' },
  { key: 'date', labelKey: 'sortDate' },
];

function SkeletonCard() {
  const { colors, radius, shadow } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: radius.lg + 2,
        borderWidth: 1,
        borderColor: colors.line,
        padding: 14,
        gap: 9,
        ...shadow.card,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Skeleton width={90} height={14} />
        <Skeleton width={64} height={16} radius={999} />
      </View>
      <Skeleton width="75%" height={15} />
      <Skeleton width="52%" height={12} tone="field" />
    </View>
  );
}

export default function ResultsScreen({ navigation }: HomeScreenProps<'Results'>) {
  const { colors, fonts, fs, lang, radius } = useTheme();
  const t = getStrings(lang);
  const insets = useSafeAreaInsets();
  const { results, total, loading, loadingMore, error, sortBy, sortDir, changeSort, loadMore, refresh, hasMore } =
    useSearch();
  const [shareOpen, setShareOpen] = useState(false);

  const arrow = (key: SortKey) => (sortBy === key ? (sortDir > 0 ? ' ↑' : ' ↓') : '');

  const header = (
    <HeroGradient>
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 16,
          paddingBottom: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <RoundButton icon="back" color="#fff" background="rgba(255,255,255,0.16)" onPress={() => navigation.goBack()} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.heading, fontSize: fs(20), color: '#fff', letterSpacing: -0.3 }}>
            {t.results}
          </Text>
          <Text style={{ fontSize: fs(12), color: 'rgba(255,255,255,0.82)' }}>
            {t.foundCount(groupDigits(total))}
          </Text>
        </View>
        <RoundButton icon="share" color={colors.brand} background="#fff" elevated onPress={() => setShareOpen(true)} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, alignItems: 'center', gap: 8 }}
      >
        <Text style={{ fontSize: fs(12), color: 'rgba(255,255,255,0.7)' }}>{t.sortBy}</Text>
        {SORTS.map(({ key, labelKey }) => {
          const selected = sortBy === key;
          return (
            <Pressable
              key={key}
              onPress={() => changeSort(key)}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 999,
                borderWidth: 1,
                backgroundColor: selected ? '#fff' : 'rgba(255,255,255,0.14)',
                borderColor: selected ? '#fff' : 'rgba(255,255,255,0.3)',
              }}
            >
              <Text style={{ fontSize: fs(12.5), fontWeight: '600', color: selected ? colors.brand : '#fff' }}>
                {t[labelKey] as string}
                {arrow(key)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </HeroGradient>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {header}

      {loading ? (
        <ScrollView contentContainerStyle={{ padding: 14, gap: 11 }}>
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </ScrollView>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={{ padding: 14, paddingBottom: 108, gap: 11, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.brand} />}
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
          renderItem={({ item }) => (
            <SubjectCard subject={item} onPress={() => navigation.navigate('Detail', { subject: item })} />
          )}
          ListEmptyComponent={
            error ? (
              <Card style={{ padding: 24 }}>
                <EmptyState icon="search" title={t.networkError} body={String(error.message || '')} />
              </Card>
            ) : (
              <EmptyState icon="search" title={t.emptyTitle} body={t.emptyBody} />
            )
          }
          ListFooterComponent={
            results.length > 0 ? (
              <View style={{ gap: 8, paddingTop: 3 }}>
                {loadingMore ? <ActivityIndicator color={colors.brand} /> : null}
                {hasMore && !loadingMore ? (
                  <Pressable
                    onPress={loadMore}
                    style={{
                      height: 46,
                      borderRadius: radius.lg,
                      borderWidth: 1,
                      borderColor: '#cdd8e3',
                      backgroundColor: colors.card,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <Icon name="arrowDown" size={17} color={colors.brand} />
                    <Text style={{ fontFamily: fonts.heading, fontSize: fs(15), color: colors.brand }}>
                      {t.loadMore}
                    </Text>
                  </Pressable>
                ) : null}
                <Text style={{ textAlign: 'center', fontSize: fs(12), color: colors.faint, paddingVertical: 6 }}>
                  {t.showing(groupDigits(results.length), groupDigits(total))}
                </Text>
              </View>
            ) : null
          }
        />
      )}

      <ExportSheet
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        count={total}
        rows={results}
        title={t.results}
      />
    </View>
  );
}
