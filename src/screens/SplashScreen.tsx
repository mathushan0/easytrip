// ─────────────────────────────────────────────────────────────────────────────
// SPLASH SCREEN
// Animated floating plane emoji (keyframe up-down)
// LIK badge 72x72px, EasyTrip wordmark
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { LIKBadge } from '@components/shared/LIKBadge';
import { useTheme } from '@theme/useTheme';
import { FONT_FAMILIES } from '@theme/fonts';

const { height } = Dimensions.get('window');

export function SplashScreen(): React.ReactElement {
  const { theme } = useTheme();

  // Floating plane animation
  const planeY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const badgeScale = useSharedValue(0);

  useEffect(() => {
    // Fade in
    opacity.value = withTiming(1, { duration: 600 });

    // Badge pop in
    badgeScale.value = withDelay(
      300,
      withSpring(1, { damping: 10, stiffness: 150 }),
    );

    // Continuous floating loop
    planeY.value = withDelay(
      400,
      withRepeat(
        withTiming(-18, {
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
        }),
        -1, // infinite
        true, // reverse
      ),
    );
  }, [opacity, badgeScale, planeY]);

  const planeStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: planeY.value }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  return (
    <View style={[styles.root, { backgroundColor: theme.bg_primary }]}>
      <Animated.View style={[styles.content, containerStyle]}>
        {/* Floating plane */}
        <Animated.Text style={[styles.plane, planeStyle]}>✈️</Animated.Text>

        {/* LIK badge 72x72 */}
        <Animated.View style={badgeStyle}>
          <LIKBadge size="splash" style={styles.badge} />
        </Animated.View>

        {/* Wordmark */}
        <View style={styles.wordmark}>
          <Text
            style={[
              styles.wordmarkEasy,
              {
                fontFamily: FONT_FAMILIES.fredokaBold,
                color: theme.text_primary,
              },
            ]}
          >
            Easy
          </Text>
          <Text
            style={[
              styles.wordmarkTrip,
              {
                fontFamily: FONT_FAMILIES.fredokaBold,
                color: theme.brand_gold ?? '#FFD93D',
              },
            ]}
          >
            Trip
          </Text>
        </View>

        <Text
          style={[
            styles.tagline,
            {
              fontFamily: FONT_FAMILIES.nunitoSemiBold,
              color: theme.text_secondary,
            },
          ]}
        >
          Plan smarter. Travel better.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 20,
  },
  plane: {
    fontSize: 56,
    marginBottom: 8,
  },
  badge: {
    // 72x72 handled inside LIKBadge via size="splash"
  },
  wordmark: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  wordmarkEasy: {
    fontSize: 40,
  },
  wordmarkTrip: {
    fontSize: 40,
  },
  tagline: {
    fontSize: 16,
    marginTop: -8,
  },
});
