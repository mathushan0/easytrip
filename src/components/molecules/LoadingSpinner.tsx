import React, { useEffect } from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@theme/useTheme';

export interface LoadingSpinnerProps {
  size?: number;
  colour?: string;
  label?: string;
  style?: ViewStyle;
}

export function LoadingSpinner({
  size = 32,
  colour,
  label,
  style,
}: LoadingSpinnerProps): React.ReactElement {
  const { theme } = useTheme();
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 900, easing: Easing.linear }),
      -1,
      false
    );
  }, [rotation]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const resolvedColour = colour ?? theme.interactive_primary;

  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? 'Loading…'}
      accessibilityLiveRegion="polite"
    >
      <Animated.View
        style={[
          styles.spinner,
          spinStyle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: Math.max(2, size * 0.1),
            borderColor: `${resolvedColour}33`,
            borderTopColor: resolvedColour,
          },
        ]}
      />
      {label ? (
        <Text
          style={[
            styles.label,
            { fontFamily: theme.font_body, color: theme.text_secondary },
          ]}
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  spinner: {},
  label: {
    fontSize: 13,
    lineHeight: 18,
  },
});
