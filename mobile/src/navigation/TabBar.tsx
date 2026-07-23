import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import Icon from '../components/Icon';
import { getStrings, type Strings } from '../i18n/strings';
import { useTheme } from '../theme/ThemeProvider';
import type { RootTabParamList } from './types';

type TabName = keyof RootTabParamList;

const ICONS: Record<TabName, string> = {
  HomeTab: 'search',
  ReportsTab: 'table',
  ChartsTab: 'bars',
  SettingsTab: 'gear',
};

const LABELS: Record<TabName, keyof Strings> = {
  HomeTab: 'tabHome',
  ReportsTab: 'tabReports',
  ChartsTab: 'tabCharts',
  SettingsTab: 'tabSettings',
};

/** Translucent chrome bar with a soft-filled active pill, per the prototype. */
export default function TabBar({ state, navigation }: BottomTabBarProps) {
  const { colors, fs, lang } = useTheme();
  const t = getStrings(lang);
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.chrome,
        borderTopWidth: 1,
        borderTopColor: colors.line2,
        paddingTop: 7,
        paddingHorizontal: 6,
        paddingBottom: Math.max(insets.bottom, 10),
      }}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const color = focused ? colors.brand : '#94a3b8';

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name as TabName);
            }}
            style={{
              flex: 1,
              alignItems: 'center',
              gap: 3,
              paddingVertical: 6,
              marginHorizontal: 3,
              borderRadius: 13,
              backgroundColor: focused ? colors.tint.blue09 : 'transparent',
            }}
          >
            <Icon
              name={ICONS[route.name as TabName]}
              size={23}
              color={color}
              fill={focused ? colors.tint.blue16 : undefined}
            />
            <Text style={{ fontSize: fs(10), fontWeight: focused ? '600' : '500', color }}>
              {t[LABELS[route.name as TabName]] as string}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
