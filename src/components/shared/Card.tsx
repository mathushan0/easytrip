// ─────────────────────────────────────────────────────────────────────────────
// SHARED — Card
// White bg, 20-24px radius, 3px dark border, 4px flat shadow
// On press: lift -1 -1, shadow expands to 6px
// On release: spring snap back
// ─────────────────────────────────────────────────────────────────────────────

import React, { type PropsWithChildren } from 'react';
import { type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useTheme } from '@theme/useTheme';

export interface CardProps extends PropsWithChildren {
  onPress?: () => void;
  style?: ViewStyle;
  radius?: number;
  /** Disables the press lift animation */
  static?: boolean;
}

export function Card({
  children,
  onPress,
  style,
  radius = 20,
  static: isStatic = false,
}: CardProps): React.ReactElement {
  const { theme } = useTheme();

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const shadowSize = useSharedValue(4);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    shadowOffset: {
      width: shadowSize.value,
      height: shadowSize.value,
    },
  }));

  const onPressIn = () => {
    if (isStatic) return;
    translateX.value = withSpring(-1, { damping: 15, stiffness: 300 });
    translateY.value = withSpring(-1, { damping: 15, stiffness: 300 });
    shadowSize.value = withSpring(6, { damping: 15, stiffness: 300 });
  };

  const onPressOut = () => {
    if (isStatic) return;
    // Spring snap back with cubic-bezier feel
    translateX.value = withSpring(0, { damping: 10, stiffness: 200, mass: 0.5 });
    translateY.value = withSpring(0, { damping: 10, stiffness: 200, mass: 0.5 });
    shadowSize.value = withSpring(4, { damping: 10, stiffness: 200 });
  };

  const containerStyle: ViewStyle = {
    backgroundColor: theme.bg_surface,
    borderRadius: radius,
    borderWidth: 3,
    borderColor: theme.text_primary,
    shadowColor: theme.text_primary,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 0,
    elevation: 4,
    overflow: 'hidden',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
    >
      <Animated.View style={[containerStyle, animStyle, style]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}
