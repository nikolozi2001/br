import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Text, View } from 'react-native';

import { getStrings } from '../i18n/strings';
import { useTheme } from '../theme/ThemeProvider';

/** Branded launch overlay — visible for ~1.9s, then fades out. */
export default function Splash({ onDone }: { onDone: () => void }) {
  const { colors, fonts, fs } = useTheme();
  const t = getStrings('ka');
  const fade = useRef(new Animated.Value(1)).current;
  const dots = [useRef(new Animated.Value(0.4)).current, useRef(new Animated.Value(0.4)).current, useRef(new Animated.Value(0.4)).current];

  useEffect(() => {
    const pulses = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(dot, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.4, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ),
    );
    pulses.forEach((p) => p.start());

    const timer = setTimeout(() => {
      Animated.timing(fade, { toValue: 0, duration: 420, useNativeDriver: true }).start(onDone);
    }, 1500);

    return () => {
      clearTimeout(timer);
      pulses.forEach((p) => p.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 22,
        opacity: fade,
      }}
    >
      <Image
        source={require('../../assets/splash-icon.png')}
        resizeMode="contain"
        style={{ width: 240, height: 150 }}
      />
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Text style={{ fontFamily: fonts.heading, fontSize: fs(20), color: colors.ink }}>{t.appName}</Text>
        <Text style={{ fontSize: fs(12.5), color: colors.muted, textAlign: 'center' }}>{t.appOwner}</Text>
      </View>
      <View style={{ position: 'absolute', bottom: 46, flexDirection: 'row', gap: 6 }}>
        {dots.map((dot, i) => (
          <Animated.View
            key={i}
            style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.brand, opacity: dot }}
          />
        ))}
      </View>
    </Animated.View>
  );
}
