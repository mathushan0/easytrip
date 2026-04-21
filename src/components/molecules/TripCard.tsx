import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { useTheme } from '@theme/useTheme';
import { ProgressBar } from '../atoms/ProgressBar';
import { Badge } from '../atoms/Badge';
import type { Trip } from '@/types';

// ─── Hero card (full-width, used on Home & Trip Overview) ──────────────────

export interface TripCardProps {
  trip: Trip;
  completedTasks?: number;
  totalTasks?: number;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'hero' | 'mini';
}

export function TripCard({
  trip,
  completedTasks = 0,
  totalTasks = 0,
  onPress,
  style,
  variant = 'hero',
}: TripCardProps): React.ReactElement {
  const { theme } = useTheme();

  const progress =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const coverUri = trip.coverPhotoUrl;

  const cardStyle: ViewStyle = {
    borderRadius: theme.radius_xl,
    overflow: 'hidden',
    backgroundColor: theme.bg_surface,
    ...(variant === 'hero' ? styles.hero : styles.mini),
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[cardStyle, style]}
      activeOpacity={0.92}
      accessibilityRole="button"
      accessibilityLabel={`${trip.destination} trip. ${trip.durationDays} days.`}
    >
      {coverUri ? (
        <ImageBackground
          source={{ uri: coverUri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: theme.bg_raised }]}
        />
      )}

      {/* Gradient overlay */}
      <LinearGradient
        colors={theme.gradient_hero}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Content */}
      <View style={styles.content}>
        {trip.destinationConfidence === 'low' ? (
          <Badge label="LIMITED DATA" variant="warning" style={styles.badge} />
        ) : null}

        <Text
          style={[
            styles.destination,
            {
              fontFamily: theme.font_display,
              color: '#FFFFFF',
              fontSize: variant === 'hero' ? 28 : 18,
            },
          ]}
          numberOfLines={1}
        >
          {trip.destination.toUpperCase()}
        </Text>

        <Text
          style={[
            styles.meta,
            {
              fontFamily: theme.font_serif,
              color: 'rgba(255,255,255,0.8)',
              fontSize: variant === 'hero' ? 16 : 13,
            },
          ]}
        >
          {trip.durationDays}-day {trip.tripType ?? 'adventure'}
        </Text>

        {variant === 'hero' && totalTasks > 0 ? (
          <View style={styles.progressRow}>
            <ProgressBar
              progress={progress}
              height={4}
              colour={theme.brand_lime}
              trackColour="rgba(255,255,255,0.2)"
              style={styles.progressBar}
              accessibilityLabel={`Trip progress: ${Math.round(progress)}%`}
            />
            <Text
              style={[
                styles.progressLabel,
                { fontFamily: theme.font_mono, color: 'rgba(255,255,255,0.7)' },
              ]}
            >
              {Math.round(progress)}%
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 200,
    width: '100%',
  },
  mini: {
    height: 96,
    width: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
    gap: 4,
  },
  badge: {
    marginBottom: 6,
  },
  destination: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  meta: {
    fontStyle: 'italic',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
  },
  progressLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
    minWidth: 32,
    textAlign: 'right',
  },
});
