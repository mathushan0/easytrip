import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
  type TouchableOpacityProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@theme/useTheme';

export type IconButtonVariant = 'ghost' | 'filled' | 'outline';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  icon: React.ReactElement;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  accessibilityLabel: string;
  style?: ViewStyle;
  active?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const SIZE_MAP: Record<IconButtonSize, number> = {
  sm: 32,
  md: 44,
  lg: 52,
};

export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  accessibilityLabel,
  style,
  active = false,
  onPress,
  disabled,
  ...rest
}: IconButtonProps): React.ReactElement {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const dim = SIZE_MAP[size];

  const containerStyle: ViewStyle = {
    width: dim,
    height: dim,
    borderRadius: dim / 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...(variant === 'filled' && {
      backgroundColor: active ? theme.interactive_primary : theme.bg_raised,
    }),
    ...(variant === 'ghost' && {
      backgroundColor: active ? theme.interactive_ghost : 'transparent',
    }),
    ...(variant === 'outline' && {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: active ? theme.interactive_primary : theme.border_default,
    }),
    ...(disabled && { opacity: 0.4 }),
  };

  return (
    <AnimatedTouchable
      style={[containerStyle, animStyle, style]}
      onPress={onPress}
      onPressIn={() =>
        (scale.value = withSpring(0.9, { damping: 15, stiffness: 400 }))
      }
      onPressOut={() =>
        (scale.value = withSpring(1, { damping: 15, stiffness: 400 }))
      }
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled, selected: active }}
      activeOpacity={0.8}
      {...rest}
    >
      {icon}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({});
