import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  type ViewStyle,
  type TextStyle,
  type TouchableOpacityProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@theme/useTheme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactElement;
  rightIcon?: React.ReactElement;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  textStyle,
  onPress,
  ...rest
}: ButtonProps): React.ReactElement {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const isDisabled = disabled || loading;

  const containerStyle: ViewStyle = {
    ...sizeStyles[size].container,
    ...(fullWidth && { alignSelf: 'stretch' }),
    ...(isDisabled && { opacity: 0.5 }),
    ...variantContainerStyle(variant, theme),
  };

  const labelColor = variantTextColor(variant, theme);

  return (
    <AnimatedTouchable
      style={[containerStyle, animStyle, style]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      activeOpacity={0.9}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={labelColor}
        />
      ) : (
        <View style={styles.inner}>
          {leftIcon ? (
            <View style={styles.iconLeft}>{leftIcon}</View>
          ) : null}
          <Text
            style={[
              sizeStyles[size].label,
              { fontFamily: theme.font_body_medium, color: labelColor },
              textStyle,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {rightIcon ? (
            <View style={styles.iconRight}>{rightIcon}</View>
          ) : null}
        </View>
      )}
    </AnimatedTouchable>
  );
}

// ─── Style helpers ────────────────────────────────────────────────────────────

function variantContainerStyle(
  variant: ButtonVariant,
  theme: ReturnType<typeof useTheme>['theme']
): ViewStyle {
  switch (variant) {
    case 'primary':
      return {
        backgroundColor: theme.interactive_primary,
        borderWidth: 0,
      };
    case 'secondary':
      return {
        backgroundColor: theme.bg_raised,
        borderWidth: 1,
        borderColor: theme.border_default,
      };
    case 'ghost':
      return {
        backgroundColor: theme.interactive_ghost,
        borderWidth: 0,
      };
    case 'danger':
      return {
        backgroundColor: theme.system_error,
        borderWidth: 0,
      };
    case 'outline':
      return {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.interactive_primary,
      };
  }
}

function variantTextColor(
  variant: ButtonVariant,
  theme: ReturnType<typeof useTheme>['theme']
): string {
  switch (variant) {
    case 'primary':
      return theme.text_inverse;
    case 'secondary':
      return theme.text_primary;
    case 'ghost':
      return theme.interactive_primary;
    case 'danger':
      return '#FFFFFF';
    case 'outline':
      return theme.interactive_primary;
  }
}

const sizeStyles: Record<
  ButtonSize,
  { container: ViewStyle; label: TextStyle }
> = {
  sm: {
    container: {
      height: 36,
      paddingHorizontal: 16,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: { fontSize: 13, fontWeight: '500' },
  },
  md: {
    container: {
      height: 48,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: { fontSize: 15, fontWeight: '500' },
  },
  lg: {
    container: {
      height: 56,
      paddingHorizontal: 32,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: { fontSize: 17, fontWeight: '500' },
  },
};

const styles = StyleSheet.create({
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
});
