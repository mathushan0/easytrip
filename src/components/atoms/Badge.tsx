import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '@theme/useTheme';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'pro' | 'voyager';

export interface BadgeProps {
  label?: string;
  variant?: BadgeVariant;
  dot?: boolean; // Show as a dot without text
  style?: ViewStyle;
}

export function Badge({
  label,
  variant = 'default',
  dot = false,
  style,
}: BadgeProps): React.ReactElement {
  const { theme } = useTheme();

  const { bg, text } = VARIANT_COLOURS(variant, theme);

  if (dot) {
    return (
      <View
        style={[
          styles.dot,
          { backgroundColor: bg },
          style,
        ]}
        accessibilityRole="none"
        accessibilityLabel={label}
      />
    );
  }

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            fontFamily: theme.font_mono,
            color: text,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

function VARIANT_COLOURS(
  variant: BadgeVariant,
  theme: ReturnType<typeof useTheme>['theme']
): { bg: string; text: string } {
  switch (variant) {
    case 'success':
      return { bg: `${theme.system_success}22`, text: theme.system_success };
    case 'warning':
      return { bg: `${theme.system_warning}22`, text: theme.system_warning };
    case 'error':
      return { bg: `${theme.system_error}22`, text: theme.system_error };
    case 'info':
      return { bg: `${theme.system_info}22`, text: theme.system_info };
    case 'pro':
      return { bg: theme.brand_violet, text: '#FFFFFF' };
    case 'voyager':
      return { bg: theme.brand_gold, text: theme.text_inverse };
    default:
      return { bg: theme.bg_raised, text: theme.text_secondary };
  }
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
