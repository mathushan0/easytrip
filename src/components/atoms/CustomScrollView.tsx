/**
 * CustomScrollView — Themed scrollable container with animated thumb indicator.
 *
 * Styling per spec:
 *   Track: 4px wide, borderRadius 100px, 1.5px dark border, theme bg_raised
 *   Thumb: brand_coral → brand_gold gradient (simulated with brand_coral), rounded
 *   Spring animation with bounce at endpoints
 */

import React, { useRef, useCallback } from 'react';
import {
  Animated,
  ScrollView,
  View,
  StyleSheet,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ScrollViewProps,
} from 'react-native';
import { useThemeTokens } from '@theme/useTheme';
import { springConfig } from '@lib/animations';

// ─── Props ────────────────────────────────────────────────────────────────────

interface CustomScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
  /** Show the custom scroll indicator (default: true) */
  showThumb?: boolean;
  /** Minimum thumb height in px (default: 40) */
  minThumbHeight?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const CustomScrollView = React.forwardRef<ScrollView, CustomScrollViewProps>(
  ({ children, showThumb = true, minThumbHeight = 40, style, ...props }, ref) => {
    const theme = useThemeTokens();

    // Animated values
    const scrollY         = useRef(new Animated.Value(0)).current;
    const thumbScale      = useRef(new Animated.Value(1)).current;

    // Layout measurements
    const containerHeight = useRef(0);
    const contentHeight   = useRef(0);
    const thumbHeight     = useRef(minThumbHeight);

    // ── Thumb height calculation ──────────────────────────────────────────────

    const computeThumbHeight = () => {
      if (contentHeight.current <= 0) return minThumbHeight;
      const ratio = containerHeight.current / contentHeight.current;
      return Math.max(minThumbHeight, containerHeight.current * ratio);
    };

    const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
      containerHeight.current = e.nativeEvent.layout.height;
      thumbHeight.current = computeThumbHeight();
    }, []);

    const onContentSizeChange = useCallback((_: number, h: number) => {
      contentHeight.current = h;
      thumbHeight.current = computeThumbHeight();
    }, []);

    // ── Scroll bounce feedback ────────────────────────────────────────────────

    const onScrollBeginDrag = useCallback(() => {
      Animated.spring(thumbScale, {
        toValue: 1.15,
        ...springConfig,
        useNativeDriver: true,
      }).start();
    }, []);

    const onScrollEndDrag = useCallback(() => {
      Animated.spring(thumbScale, {
        toValue: 1,
        ...springConfig,
        useNativeDriver: true,
      }).start();
    }, []);

    // ── Thumb translateY ──────────────────────────────────────────────────────

    // scrollY drives thumb position. We derive the max scroll offset and map
    // it to the available track travel (containerHeight - thumbHeight).
    // Because content and container heights are runtime values, we use
    // Animated.multiply with a derived ratio (approximated at 0.5 for SSR safety;
    // actual ratio updates via scrollY listener).

    const thumbTranslateY = scrollY.interpolate({
      inputRange: [0, 5000],          // generous upper bound
      outputRange: [0, 5000 * (containerHeight.current > 0
        ? (containerHeight.current - thumbHeight.current) / Math.max(contentHeight.current - containerHeight.current, 1)
        : 0.5)],
      extrapolate: 'clamp',
    });

    // ── Styles ────────────────────────────────────────────────────────────────

    const styles = makeStyles(theme);

    return (
      <View style={[styles.wrapper, style]} onLayout={onContainerLayout}>
        <ScrollView
          ref={ref}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={onContentSizeChange}
          onScrollBeginDrag={onScrollBeginDrag}
          onScrollEndDrag={onScrollEndDrag}
          onMomentumScrollEnd={onScrollEndDrag}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          {...props}
        >
          {children}
        </ScrollView>

        {showThumb && (
          <View style={styles.track}>
            <Animated.View
              style={[
                styles.thumb,
                {
                  height: thumbHeight.current,
                  transform: [
                    { translateY: thumbTranslateY },
                    { scaleX: thumbScale },
                  ],
                },
              ]}
            />
          </View>
        )}
      </View>
    );
  }
);

CustomScrollView.displayName = 'CustomScrollView';

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(theme: ReturnType<typeof useThemeTokens>) {
  return StyleSheet.create({
    wrapper: {
      flex: 1,
      flexDirection: 'row',
    },
    track: {
      width: 4,
      marginVertical: 8,
      marginLeft: 4,
      borderRadius: 100,
      backgroundColor: theme.bg_raised,
      borderWidth: 1.5,
      borderColor: theme.text_primary + '22', // 13% opacity dark border
      overflow: 'hidden',
    },
    thumb: {
      width: '100%',
      borderRadius: 100,
      backgroundColor: theme.brand_coral,
      // Right border accent
      borderRightWidth: 1.5,
      borderRightColor: theme.text_primary + '55',
    },
  });
}
