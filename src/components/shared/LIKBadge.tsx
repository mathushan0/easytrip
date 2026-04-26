// ─────────────────────────────────────────────────────────────────────────────
// SHARED — LIKBadge
// Yellow rounded square (Bubbly theme), gradient per Aurora/Sand/Electric
// 44x44px in nav, 72x72px on splash. Renders on every screen.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@theme/useTheme';
import { FONT_FAMILIES } from '@theme/fonts';

export type LIKBadgeSize = 'nav' | 'splash';

export interface LIKBadgeProps {
  size?: LIKBadgeSize;
  style?: ViewStyle;
}

export function LIKBadge({ size = 'nav', style }: LIKBadgeProps): React.ReactElement {
  const { theme, themeName } = useTheme();
  const dimension = size === 'splash' ? 72 : 44;
  const fontSize = size === 'splash' ? 32 : 20;
  const radius = size === 'splash' ? 18 : 12;

  const containerStyle: ViewStyle = {
    width: dimension,
    height: dimension,
    borderRadius: radius,
    borderWidth: 2,
    borderColor: theme.text_primary,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...style,
  };

  // Gradient themes
  const isGradientTheme =
    themeName === 'aurora_dark' ||
    themeName === 'warm_sand' ||
    themeName === 'electric';

  if (isGradientTheme) {
    return (
      <LinearGradient
        colors={theme.gradient_primary as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={containerStyle}
      >
        <Text style={[styles.emoji, { fontSize }]}>✈️</Text>
      </LinearGradient>
    );
  }

  // Bubbly default: yellow square
  return (
    <View
      style={[
        containerStyle,
        { backgroundColor: theme.brand_gold ?? '#FFD93D' },
      ]}
    >
      <Text style={[styles.emoji, { fontSize }]}>✈️</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emoji: {
    // emoji is self-contained
  },
});
