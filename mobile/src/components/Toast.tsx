import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

import { useAppStore } from '../state/AppStore';
import { useTheme } from '../theme/ThemeProvider';
import Icon from './Icon';

/** Floating pill toast pinned above the tab bar, with an optional undo action. */
export default function Toast(): React.ReactElement | null {
  const { toast, hideToast } = useAppStore();
  const { fs } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: toast ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [toast, anim]);

  if (!toast) return null;

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 96, alignItems: 'center' }}>
      <Animated.View
        style={{
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: 'rgba(26,26,46,0.92)',
          paddingVertical: 11,
          paddingHorizontal: 18,
          borderRadius: 999,
        }}
      >
        <Icon name="check" size={15} color="#4ade80" width={2.5} />
        <Text style={{ color: '#fff', fontSize: fs(13), fontWeight: '500' }}>{toast.message}</Text>
        {toast.action ? (
          <Pressable
            onPress={() => {
              toast.action?.();
              hideToast();
            }}
            style={{
              marginLeft: 4,
              paddingVertical: 3,
              paddingHorizontal: 10,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.16)',
            }}
          >
            <Text style={{ color: '#7cc4ff', fontWeight: '700', fontSize: fs(13) }}>{toast.actionLabel}</Text>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}
