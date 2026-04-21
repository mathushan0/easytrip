import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@theme/useTheme';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  leftElement?: React.ReactElement;
  rightElement?: React.ReactElement;
  size?: 'sm' | 'md';
  disabled?: boolean;
  style?: ViewStyle;
  colour?: string; // Override background when selected
}

export function Chip({
  label,
  selected = false,
  onPress,
  leftElement,
  rightElement,
  size = 'md',
  disabled = false,
  style,
  colour,
}: ChipProps): React.ReactElement {
  const { theme } = useTheme();

  const height = size === 'sm' ? 32 : 40;
  const fontSize = size === 'sm' ? 12 : 14;
  const px = size === 'sm' ? 12 : 16;

  const bg = selected
    ? colour ?? theme.interactive_ghost
    : 'transparent';

  const borderColor = selected
    ? colour ?? theme.interactive_primary
    : theme.border_default;

  const textColor = selected
    ? colour ?? theme.interactive_primary
    : theme.text_secondary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || !onPress}
      style={[
        styles.chip,
        {
          height,
          paddingHorizontal: px,
          borderRadius: height / 2,
          backgroundColor: bg,
          borderColor,
          borderWidth: 1,
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
    >
      {leftElement ? <View style={styles.leftEl}>{leftElement}</View> : null}
      <Text
        style={[
          styles.label,
          {
            fontFamily: theme.font_body_medium,
            color: textColor,
            fontSize,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {rightElement ? (
        <View style={styles.rightEl}>{rightElement}</View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { letterSpacing: 0.1 },
  leftEl: { marginRight: 6 },
  rightEl: { marginLeft: 6 },
});
