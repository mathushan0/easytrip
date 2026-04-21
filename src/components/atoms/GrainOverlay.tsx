import React, { useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Filter, FeTurbulence, FeColorMatrix, Rect } from 'react-native-svg';
import { useTheme } from '@theme/useTheme';

export interface GrainOverlayProps {
  opacity?: number;
  style?: ViewStyle;
  /** If true, renders as a full-screen absolute overlay */
  fullscreen?: boolean;
}

/**
 * GrainOverlay — adds analogue film grain texture to the UI.
 * Uses SVG feTurbulence to generate noise.
 * Opacity is driven by the active theme's grain_opacity token.
 */
export function GrainOverlay({
  opacity,
  style,
  fullscreen = false,
}: GrainOverlayProps): React.ReactElement {
  const { theme } = useTheme();
  const resolvedOpacity = opacity ?? theme.grain_opacity;

  const containerStyle: ViewStyle = {
    ...(fullscreen && StyleSheet.absoluteFillObject),
    pointerEvents: 'none',
  };

  return (
    <View
      style={[containerStyle, style]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Svg
        width="100%"
        height="100%"
        style={{ opacity: resolvedOpacity }}
      >
        <Filter id="grain" x="0%" y="0%" width="100%" height="100%">
          <FeTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <FeColorMatrix type="saturate" values="0" />
        </Filter>
        <Rect
          width="100%"
          height="100%"
          filter="url(#grain)"
          fill="rgba(255,255,255,0.15)"
        />
      </Svg>
    </View>
  );
}

// ─── Electric scanline overlay ────────────────────────────────────────────────

export function ScanlineOverlay({
  style,
}: {
  style?: ViewStyle;
}): React.ReactElement | null {
  const { theme } = useTheme();
  if (!theme.scanline_opacity) return null;

  return (
    <View
      style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }, style]}
      pointerEvents="none"
      accessibilityElementsHidden
    >
      <Svg width="100%" height="100%" style={{ opacity: theme.scanline_opacity }}>
        {Array.from({ length: 200 }).map((_, i) => (
          <Rect
            key={i}
            x="0"
            y={i * 4}
            width="100%"
            height="1"
            fill={theme.text_primary}
          />
        ))}
      </Svg>
    </View>
  );
}
