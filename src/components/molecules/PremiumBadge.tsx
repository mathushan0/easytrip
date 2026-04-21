import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { Lock, Zap } from 'lucide-react-native';
import { useTheme } from '@theme/useTheme';
import type { UserTier } from '@/types';

export interface PremiumBadgeProps {
  tier: Extract<UserTier, 'voyager' | 'nomad_pro'>;
  style?: ViewStyle;
  size?: 'sm' | 'md';
  lockIcon?: boolean;
}

export function PremiumBadge({
  tier,
  style,
  size = 'sm',
  lockIcon = false,
}: PremiumBadgeProps): React.ReactElement {
  const { theme } = useTheme();

  const isPro = tier === 'nomad_pro';
  const bg = isPro ? theme.brand_violet : theme.brand_gold;
  const textColour = isPro ? '#FFFFFF' : theme.text_inverse;
  const label = isPro ? 'Pro' : 'Voyager';
  const fontSize = size === 'sm' ? 9 : 11;
  const px = size === 'sm' ? 6 : 10;
  const py = size === 'sm' ? 2 : 4;
  const iconSize = size === 'sm' ? 9 : 11;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          paddingHorizontal: px,
          paddingVertical: py,
          borderRadius: 6,
        },
        style,
      ]}
      accessibilityLabel={`${label} feature`}
    >
      {lockIcon ? (
        <Lock size={iconSize} color={textColour} strokeWidth={2.5} />
      ) : (
        <Zap size={iconSize} color={textColour} fill={textColour} />
      )}
      <Text
        style={[
          styles.label,
          {
            fontFamily: theme.font_mono,
            color: textColour,
            fontSize,
          },
        ]}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
  },
  label: {
    letterSpacing: 0.8,
    fontWeight: '700',
  },
});
