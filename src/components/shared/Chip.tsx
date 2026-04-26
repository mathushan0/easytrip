// ─────────────────────────────────────────────────────────────────────────────
// SHARED — Chip
// Pill badge style, category colour system, tappable to filter/select
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@theme/useTheme';
import { FONT_FAMILIES } from '@theme/fonts';
import type { CategoryKey } from '@/types';

export interface ChipProps {
  label: string;
  category?: CategoryKey;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Chip({
  label,
  category,
  selected = false,
  onPress,
  style,
}: ChipProps): React.ReactElement {
  const { theme, resolvedCategoryColour } = useTheme();

  const colour = category
    ? resolvedCategoryColour(category)
    : theme.interactive_primary;

  const bgColor = selected ? colour : `${colour}22`;
  const textColor = selected ? '#FFFFFF' : colour;
  const borderColor = colour;

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: bgColor,
          borderColor,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text
        style={[
          styles.label,
          { color: textColor, fontFamily: FONT_FAMILIES.nunitoBold },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 2,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 13,
  },
});
