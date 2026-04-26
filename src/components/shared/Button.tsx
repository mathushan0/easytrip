// ─────────────────────────────────────────────────────────────────────────────
// SHARED — Button
// primary / secondary / danger / ghost variants
// Spring scale animation on press (0.96), 48x48 min tap target
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import {
  Text,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@theme/useTheme';
import { FONT_FAMILIES } from '@theme/fonts';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface SharedButtonProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onPress,
  style,
  textStyle,
}: SharedButtonProps): React.ReactElement {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.96, { damping: 12, stiffness: 250 });
  };
  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 250 });
  };

  const containerStyle = getContainerStyle(variant, theme, size, disabled);
  const labelStyle = getLabelStyle(variant, theme, size);

  return (
    <AnimatedTouchable
      style={[containerStyle, animStyle, style]}
      onPress={disabled ? undefined : onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Text style={[labelStyle, textStyle]}>{label}</Text>
    </AnimatedTouchable>
  );
}

// ─── Style helpers ────────────────────────────────────────────────────────────

function getContainerStyle(
  variant: ButtonVariant,
  theme: ReturnType<typeof useTheme>['theme'],
  size: ButtonSize,
  disabled: boolean
): ViewStyle {
  const base: ViewStyle = {
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingHorizontal: size === 'sm' ? 14 : size === 'lg' ? 28 : 20,
    paddingVertical: size === 'sm' ? 10 : size === 'lg' ? 18 : 14,
    opacity: disabled ? 0.5 : 1,
  };

  switch (variant) {
    case 'primary':
      return {
        ...base,
        backgroundColor: theme.interactive_primary,
        borderWidth: 3,
        borderColor: theme.text_primary,
        // 5px offset shadow via elevation on Android, handled via shadow* on iOS
        shadowColor: theme.text_primary,
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: disabled ? 0 : 1,
        shadowRadius: 0,
        elevation: disabled ? 0 : 5,
      };
    case 'secondary':
      return {
        ...base,
        backgroundColor: theme.bg_surface,
        borderWidth: 3,
        borderColor: theme.text_primary,
        shadowColor: theme.text_primary,
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: disabled ? 0 : 0.9,
        shadowRadius: 0,
        elevation: disabled ? 0 : 4,
      };
    case 'danger':
      return {
        ...base,
        backgroundColor: theme.system_error,
        borderWidth: 3,
        borderColor: theme.text_primary,
        shadowColor: theme.text_primary,
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: disabled ? 0 : 1,
        shadowRadius: 0,
        elevation: disabled ? 0 : 5,
      };
    case 'ghost':
      return {
        ...base,
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: theme.border_default,
        borderStyle: 'dashed',
      };
  }
}

function getLabelStyle(
  variant: ButtonVariant,
  theme: ReturnType<typeof useTheme>['theme'],
  size: ButtonSize
): TextStyle {
  const base: TextStyle = {
    fontFamily: FONT_FAMILIES.fredokaSemiBold,
    fontSize: size === 'sm' ? 14 : size === 'lg' ? 18 : 16,
    letterSpacing: 0.2,
  };

  switch (variant) {
    case 'primary':
    case 'danger':
      return { ...base, color: '#FFFFFF' };
    case 'secondary':
      return { ...base, color: theme.text_primary };
    case 'ghost':
      return { ...base, color: theme.text_secondary };
  }
}
