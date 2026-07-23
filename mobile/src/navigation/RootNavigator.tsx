import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import ChartsScreen from '../screens/ChartsScreen';
import DetailScreen from '../screens/DetailScreen';
import FavouritesScreen from '../screens/FavouritesScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ReportDetailScreen from '../screens/ReportDetailScreen';
import ReportsScreen from '../screens/ReportsScreen';
import ResultsScreen from '../screens/ResultsScreen';
import SearchScreen from '../screens/SearchScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TabBar from './TabBar';
import { useTheme } from '../theme/ThemeProvider';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const ReportsStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();

const stackOptions = { headerShown: false, animation: 'slide_from_right' };

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={stackOptions}>
      <HomeStack.Screen name="Search" component={SearchScreen} />
      <HomeStack.Screen name="Results" component={ResultsScreen} />
      <HomeStack.Screen name="Favourites" component={FavouritesScreen} />
      <HomeStack.Screen name="Detail" component={DetailScreen} />
    </HomeStack.Navigator>
  );
}

function ReportsNavigator() {
  return (
    <ReportsStack.Navigator screenOptions={stackOptions}>
      <ReportsStack.Screen name="ReportsList" component={ReportsScreen} />
      <ReportsStack.Screen name="ReportDetail" component={ReportDetailScreen} />
    </ReportsStack.Navigator>
  );
}

function SettingsNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={stackOptions}>
      <SettingsStack.Screen name="SettingsRoot" component={SettingsScreen} />
      <SettingsStack.Screen name="History" component={HistoryScreen} />
    </SettingsStack.Navigator>
  );
}

export default function RootNavigator() {
  const { colors, dark } = useTheme();

  const navTheme = {
    ...(dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(dark ? DarkTheme : DefaultTheme).colors,
      background: colors.bg,
      card: colors.card,
      text: colors.ink,
      border: colors.line,
      primary: colors.brand,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
        <Tab.Screen name="HomeTab" component={HomeNavigator} />
        <Tab.Screen name="ReportsTab" component={ReportsNavigator} />
        <Tab.Screen name="ChartsTab" component={ChartsScreen} />
        <Tab.Screen name="SettingsTab" component={SettingsNavigator} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
