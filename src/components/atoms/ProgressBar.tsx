import React, { useEffect } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@theme/useTheme';

export interface ProgressBarProps {
  progress: number; // 0–100
  height?: number;
  colour?: string;
  trackColour?: string;
  borderRadius?: number;
  animated?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function ProgressBar({
  progress,
  height = 6,
  colour,
  trackColour,
  borderRadius,
  animated = true,
  style,
  accessibilityLabel,
}: ProgressBarProps): React.ReactElement {
  const { theme } = useTheme();
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const width = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      width.value = withTiming(clampedProgress, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      width.value = clampedProgress;
    }
  }, [clampedProgress, animated, width]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  const r = borderRadius ?? height / 2;

  return (
    <View
      style={[
        styles.track,
        {
          height,
          backgroundColor: trackColour ?? theme.bg_raised,
          borderRadius: r,
        },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: clampedProgress,
        text: accessibilityLabel ?? `${Math.round(clampedProgress)}%`,
      }}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            height,
            borderRadius: r,
            backgroundColor: colour ?? theme.interactive_primary,
          },
          barStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
