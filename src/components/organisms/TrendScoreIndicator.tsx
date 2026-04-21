import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { useTheme } from '@theme/useTheme';

interface TrendScoreIndicatorProps {
  score: number; // 0–100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animateOnMount?: boolean;
}

function scoreLabel(score: number): string {
  if (score >= 85) return 'Trending 🔥';
  if (score >= 70) return 'Popular ⭐';
  if (score >= 50) return 'Rising 📈';
  if (score >= 30) return 'Steady';
  return 'Low buzz';
}

function scoreColor(score: number, theme: ReturnType<typeof useTheme>['theme']): string {
  if (score >= 85) return theme.brand_coral;
  if (score >= 70) return theme.brand_gold;
  if (score >= 50) return theme.brand_lime;
  if (score >= 30) return theme.brand_cyan;
  return theme.text_disabled;
}

const SIZES = {
  sm: { ring: 40, fontSize: 11, labelSize: 10 },
  md: { ring: 56, fontSize: 14, labelSize: 11 },
  lg: { ring: 72, fontSize: 18, labelSize: 13 },
};

export function TrendScoreIndicator({
  score,
  size = 'md',
  showLabel = true,
  animateOnMount = true,
}: TrendScoreIndicatorProps): React.ReactElement {
  const { theme } = useTheme();
  const progress = useSharedValue(animateOnMount ? 0 : score / 100);

  React.useEffect(() => {
    if (animateOnMount) {
      progress.value = withDelay(200, withSpring(score / 100, { damping: 12, stiffness: 80 }));
    }
  }, [score]);

  const arcStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-90 + progress.value * 360}deg` }],
  }));

  const dims = SIZES[size];
  const color = scoreColor(score, theme);
  const strokeWidth = size === 'sm' ? 3 : size === 'md' ? 4 : 5;
  const innerSize = dims.ring - strokeWidth * 2;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.ringContainer, { width: dims.ring, height: dims.ring }]}>
        {/* Track ring */}
        <View
          style={[
            styles.trackRing,
            {
              width: dims.ring,
              height: dims.ring,
              borderRadius: dims.ring / 2,
              borderWidth: strokeWidth,
              borderColor: theme.bg_raised,
            },
          ]}
        />
        {/* Progress indicator — visual cue using a simple filled arc overlay */}
        <Animated.View
          style={[
            styles.progressArc,
            arcStyle,
            {
              width: dims.ring,
              height: dims.ring,
              borderRadius: dims.ring / 2,
              borderWidth: strokeWidth,
              borderColor: color,
              borderTopColor: 'transparent',
              borderLeftColor: score > 50 ? color : 'transparent',
            },
          ]}
        />
        {/* Score text */}
        <View style={[styles.centerContent, { width: innerSize, height: innerSize }]}>
          <Text
            style={[
              styles.scoreText,
              { fontSize: dims.fontSize, color: theme.text_primary, fontFamily: theme.font_display },
            ]}
          >
            {score}
          </Text>
        </View>
      </View>

      {showLabel && (
        <Text
          style={[
            styles.label,
            { fontSize: dims.labelSize, color, fontFamily: theme.font_body_medium },
          ]}
        >
          {scoreLabel(score)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 6,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  trackRing: {
    position: 'absolute',
  },
  progressArc: {
    position: 'absolute',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  scoreText: {
    fontWeight: '700',
    lineHeight: undefined,
  },
  label: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
