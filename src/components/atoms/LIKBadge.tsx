/**
 * LIKBadge — App logo badge with full theme variant support.
 *
 * Sizes:
 *   nav    → 44×44px  (tab bar / header)
 *   splash → 72×72px  (splash screen, onboarding)
 *
 * Themes:
 *   dark_light → indigo accent (#6366F1)
 *   aurora_dark → teal-purple gradient (simulated via bg + border)
 *   warm_sand   → terracotta-saffron
 *   electric    → near-black with neon lime border
 *
 * Always: 3px dark border + drop shadow.
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import type { ThemeName } from '@/types';
import { createFloatAnimation } from '@lib/animations';

// ─── Types ────────────────────────────────────────────────────────────────────

type BadgeSize = 'nav' | 'splash';

interface LIKBadgeProps {
  size?: BadgeSize;
  theme?: ThemeName;
  /** Enable gentle float animation (splash screen only) */
  float?: boolean;
  style?: ViewStyle;
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const SIZE_MAP: Record<BadgeSize, { box: number; font: number; radius: number }> = {
  nav:    { box: 44, font: 14, radius: 12 },
  splash: { box: 72, font: 22, radius: 18 },
};

// ─── Theme styles ─────────────────────────────────────────────────────────────

interface BadgeThemeStyle {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  /** Optional second colour for gradient label (not a real RN gradient — uses border tint) */
  accentBorderColor?: string;
}

const THEME_STYLES: Record<ThemeName, BadgeThemeStyle> = {
  dark_light: {
    backgroundColor: '#6366F1',
    borderColor:     '#09090B',
    textColor:       '#FFFFFF',
  },
  aurora_dark: {
    backgroundColor: '#00D4AA',
    borderColor:     '#09090B',
    textColor:       '#04060F',
    accentBorderColor: '#7B4FFF',
  },
  warm_sand: {
    backgroundColor: '#C4532A',
    borderColor:     '#2C2416',
    textColor:       '#F5F0E8',
    accentBorderColor: '#D4A020',
  },
  electric: {
    backgroundColor: '#0C0C0E',
    borderColor:     '#C8FF00',
    textColor:       '#C8FF00',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function LIKBadge({
  size = 'nav',
  theme = 'dark_light',
  float = false,
  style,
}: LIKBadgeProps) {
  const { box, font, radius } = SIZE_MAP[size];
  const themeStyle = THEME_STYLES[theme];

  // Float animation (splash only)
  const { floatValue, startFloat, stopFloat } = createFloatAnimation(8, 3000);
  const floatRef = useRef({ startFloat, stopFloat });

  useEffect(() => {
    if (float) {
      floatRef.current.startFloat();
    }
    return () => {
      floatRef.current.stopFloat();
    };
  }, [float]);

  const animatedStyle = float
    ? { transform: [{ translateY: floatValue }] }
    : {};

  return (
    <Animated.View
      style={[
        styles.badge,
        {
          width:           box,
          height:          box,
          borderRadius:    radius,
          backgroundColor: themeStyle.backgroundColor,
          borderColor:     themeStyle.borderColor,
          // Electric theme gets a neon outer glow via shadow
          shadowColor:     themeStyle.accentBorderColor ?? themeStyle.borderColor,
          shadowOffset:    { width: 3, height: 3 },
          shadowOpacity:   1,
          shadowRadius:    0,
          elevation:       4,
        },
        animatedStyle,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            fontSize:   font,
            color:      themeStyle.textColor,
            // Letter spacing varies by theme feel
            letterSpacing: theme === 'electric' ? 2 : theme === 'warm_sand' ? 1 : 0.5,
          },
        ]}
        allowFontScaling={false}
      >
        LIK
      </Text>

      {/* Accent bottom border for gradient-style themes */}
      {themeStyle.accentBorderColor && (
        <View
          style={[
            styles.accentBar,
            {
              backgroundColor: themeStyle.accentBorderColor,
              borderBottomLeftRadius:  radius,
              borderBottomRightRadius: radius,
            },
          ]}
        />
      )}
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  badge: {
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    3,
    overflow:       'hidden',
    position:       'relative',
  },
  label: {
    fontWeight: '800',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  accentBar: {
    position:   'absolute',
    bottom:     0,
    left:       0,
    right:      0,
    height:     4,
    opacity:    0.85,
  },
});
