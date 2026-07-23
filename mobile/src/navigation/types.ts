import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

import type { Subject } from '../types';

export type HomeStackParamList = {
  Search: undefined;
  Results: undefined;
  Favourites: undefined;
  Detail: { subject: Subject };
};

export type ReportsStackParamList = {
  ReportsList: undefined;
  ReportDetail: { id: number };
};

export type SettingsStackParamList = {
  SettingsRoot: undefined;
  History: undefined;
};

export type RootTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  ReportsTab: NavigatorScreenParams<ReportsStackParamList>;
  ChartsTab: undefined;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList>;
};

/** Screen props inside a tab's stack, able to also navigate across tabs. */
export type HomeScreenProps<T extends keyof HomeStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, T>,
  BottomTabScreenProps<RootTabParamList>
>;

export type ReportsScreenProps<T extends keyof ReportsStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<ReportsStackParamList, T>,
  BottomTabScreenProps<RootTabParamList>
>;

export type SettingsScreenProps<T extends keyof SettingsStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<SettingsStackParamList, T>,
  BottomTabScreenProps<RootTabParamList>
>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootTabParamList {}
  }
}
