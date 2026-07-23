import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme/ThemeProvider';
import Icon from './Icon';

/**
 * The prototype's bottom sheet: scrim + rounded panel that slides up, with a
 * separate rounded "Cancel" button underneath (iOS action-sheet convention).
 */
export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  cancelLabel: string;
  children?: React.ReactNode;
  /** Render the body in a ScrollView — for long option lists. */
  scroll?: boolean;
}

export default function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  cancelLabel,
  children,
  scroll = false,
}: BottomSheetProps) {
  const { colors, fonts, fs, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: visible ? 320 : 180,
      useNativeDriver: true,
    }).start();
  }, [visible, anim]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [600, 0] });

  const Body = scroll ? ScrollView : View;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim, opacity: anim }]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={{
            position: 'absolute',
            left: 8,
            right: 8,
            bottom: Math.max(insets.bottom, 8),
            gap: 8,
            transform: [{ translateY }],
          }}
        >
          <View
            style={{
              backgroundColor: colors.sheet,
              borderRadius: radius['2xl'],
              overflow: 'hidden',
              maxHeight: 440,
            }}
          >
            <View style={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 8, alignItems: 'center' }}>
              <View style={{ width: 36, height: 5, borderRadius: 999, backgroundColor: '#cbd5e1', marginBottom: 10 }} />
              <Text style={{ fontFamily: fonts.heading, fontSize: fs(17), color: colors.ink, textAlign: 'center' }}>
                {title}
              </Text>
              {subtitle ? (
                <Text style={{ fontSize: fs(12), color: colors.muted, marginTop: 2 }}>{subtitle}</Text>
              ) : null}
            </View>
            <Body style={{ paddingHorizontal: 10, paddingBottom: 10 }} contentContainerStyle={scroll ? { paddingBottom: 4 } : undefined}>
              {children}
            </Body>
          </View>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => ({
              backgroundColor: colors.chrome,
              borderRadius: radius.xl,
              padding: 15,
              alignItems: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontFamily: fonts.heading, fontSize: fs(16), color: colors.brand }}>{cancelLabel}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

/** A single tappable row inside an export/action sheet. */
export interface SheetRowProps {
  /** Short text badge (XLS, CSV…). Mutually exclusive with `icon`. */
  badge?: string;
  badgeColor: string;
  badgeBg: string;
  icon?: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  divider?: boolean;
}

export function SheetRow({
  badge,
  badgeColor,
  badgeBg,
  icon,
  title,
  subtitle,
  onPress,
  divider = true,
}: SheetRowProps) {
  const { colors, fs, radius } = useTheme();
  return (
    <>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 13,
          padding: 12,
          borderRadius: radius.lg,
          backgroundColor: pressed ? colors.field : 'transparent',
        })}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            backgroundColor: badgeBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {badge ? (
            <Text style={{ fontSize: fs(11), fontWeight: '700', color: badgeColor }}>{badge}</Text>
          ) : icon ? (
            <Icon name={icon} size={20} color={badgeColor} />
          ) : null}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: fs(15), color: colors.ink, fontWeight: '500' }}>{title}</Text>
          <Text style={{ fontSize: fs(12), color: colors.faint }}>{subtitle}</Text>
        </View>
        <Icon name="chevronRight" size={16} color="#cbd5e1" />
      </Pressable>
      {divider ? <View style={{ height: 1, backgroundColor: colors.line, marginLeft: 63 }} /> : null}
    </>
  );
}
