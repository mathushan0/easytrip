import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '@theme/useTheme';

// ─── Skeleton Shimmer Base ───────────────────────────────────────────────────

export interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps): React.ReactElement {
  const { theme } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const shimmer = useSharedValue(-1);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.linear }),
      -1,
      false
    );
  }, [shimmer]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          shimmer.value,
          [-1, 1],
          [-screenWidth, screenWidth]
        ),
      },
    ],
  }));

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.bg_raised,
          overflow: 'hidden',
        } as ViewStyle,
        style,
      ]}
      accessibilityRole="none"
      accessibilityElementsHidden
    >
      <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle]}>
        <LinearGradient
          colors={[
            'transparent',
            `rgba(255,255,255,0.05)`,
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, width: screenWidth * 0.4 }}
        />
      </Animated.View>
    </View>
  );
}

// ─── Composed skeleton cards ──────────────────────────────────────────────────

/** Trip card skeleton */
export function TripCardSkeleton(): React.ReactElement {
  const { theme } = useTheme();
  return (
    <View
      style={[
        skeletonStyles.tripCard,
        { backgroundColor: theme.bg_surface, borderRadius: theme.radius_xl },
      ]}
    >
      <Skeleton width="100%" height={200} borderRadius={theme.radius_xl} />
    </View>
  );
}

/** Task item skeleton */
export function TaskItemSkeleton(): React.ReactElement {
  const { theme } = useTheme();
  return (
    <View
      style={[
        skeletonStyles.taskItem,
        {
          backgroundColor: theme.bg_surface,
          borderRadius: theme.radius_md,
          borderColor: theme.border_default,
          borderWidth: StyleSheet.hairlineWidth,
        },
      ]}
    >
      <Skeleton width={22} height={22} borderRadius={11} />
      <View style={skeletonStyles.taskContent}>
        <Skeleton width={60} height={10} borderRadius={5} />
        <Skeleton width="80%" height={14} borderRadius={7} style={{ marginTop: 6 }} />
        <Skeleton width="50%" height={11} borderRadius={5} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

/** Venue card skeleton */
export function VenueCardSkeleton(): React.ReactElement {
  const { theme } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.bg_surface,
          borderRadius: theme.radius_lg,
          borderColor: theme.border_default,
          borderWidth: StyleSheet.hairlineWidth,
          overflow: 'hidden',
        },
      ]}
    >
      <Skeleton width="100%" height={160} borderRadius={0} />
      <View style={{ padding: 14, gap: 8 }}>
        <Skeleton width="70%" height={16} borderRadius={8} />
        <Skeleton width="40%" height={12} borderRadius={6} />
        <Skeleton width="55%" height={11} borderRadius={5} />
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  tripCard: {
    overflow: 'hidden',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 10,
  },
  taskContent: {
    flex: 1,
  },
});
