import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  type ViewStyle,
} from 'react-native';
import { Star, MapPin, Clock } from 'lucide-react-native';
import { useTheme } from '@theme/useTheme';
import { Badge } from '../atoms/Badge';
import { Chip } from '../atoms/Chip';
import type { Venue } from '@/types';

export interface VenueCardProps {
  venue: Venue;
  onPress?: () => void;
  style?: ViewStyle;
  compact?: boolean;
  showTrendingBadge?: boolean;
  showCelebBadge?: boolean;
  distanceMetres?: number;
}

export function VenueCard({
  venue,
  onPress,
  style,
  compact = false,
  showTrendingBadge = false,
  showCelebBadge = false,
  distanceMetres,
}: VenueCardProps): React.ReactElement {
  const { theme, resolvedCategoryColour } = useTheme();

  const coverPhoto = venue.photos?.[0];
  const isOpen = venue.openingHours?.isOpen;

  const distanceLabel = distanceMetres
    ? distanceMetres < 1000
      ? `${distanceMetres}m away`
      : `${(distanceMetres / 1000).toFixed(1)}km away`
    : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.bg_surface,
          borderColor: theme.border_default,
          borderRadius: theme.radius_lg,
        },
        compact && styles.compact,
        style,
      ]}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={`${venue.name}. ${venue.category}. ${venue.googleRating ? `Rating: ${venue.googleRating}` : ''}`}
    >
      {/* Photo */}
      {!compact && coverPhoto ? (
        <Image
          source={{ uri: coverPhoto.url }}
          style={styles.image}
          resizeMode="cover"
          accessibilityLabel={`Photo of ${venue.name}`}
        />
      ) : null}

      {/* Content */}
      <View style={[styles.content, compact && styles.contentCompact]}>
        {/* Category dot + name */}
        <View style={styles.titleRow}>
          <View
            style={[
              styles.categoryDot,
              {
                backgroundColor: resolvedCategoryColour(
                  venue.category.toLowerCase() as never ?? 'general'
                ),
              },
            ]}
            accessibilityRole="none"
            accessibilityElementsHidden
          />
          <Text
            style={[
              styles.name,
              {
                fontFamily: theme.font_display,
                color: theme.text_primary,
                fontSize: compact ? 14 : 16,
              },
            ]}
            numberOfLines={1}
          >
            {venue.name}
          </Text>
          {(showTrendingBadge || showCelebBadge) ? (
            <Badge
              label={showCelebBadge ? '⭐ CELEB' : '🔥 TRENDING'}
              variant="pro"
              style={styles.trendBadge}
            />
          ) : null}
        </View>

        {/* Rating + price */}
        <View style={styles.metaRow}>
          {venue.googleRating ? (
            <View style={styles.ratingRow}>
              <Star
                size={12}
                color={theme.brand_gold}
                fill={theme.brand_gold}
              />
              <Text
                style={[
                  styles.ratingText,
                  { fontFamily: theme.font_body, color: theme.text_secondary },
                ]}
              >
                {venue.googleRating.toFixed(1)}
                {venue.googleReviewCount
                  ? ` (${venue.googleReviewCount.toLocaleString()})`
                  : ''}
              </Text>
            </View>
          ) : null}
          {venue.priceLevel ? (
            <Text
              style={[
                styles.priceLevel,
                { fontFamily: theme.font_mono, color: theme.text_secondary },
              ]}
              accessibilityLabel={`Price level: ${venue.priceLevel} out of 4`}
            >
              {'£'.repeat(venue.priceLevel)}
            </Text>
          ) : null}
        </View>

        {/* Distance + hours */}
        {!compact ? (
          <View style={styles.metaRow}>
            {distanceLabel ? (
              <View style={styles.metaItem}>
                <MapPin size={11} color={theme.text_secondary} />
                <Text
                  style={[
                    styles.metaText,
                    { fontFamily: theme.font_body, color: theme.text_secondary },
                  ]}
                >
                  {distanceLabel}
                </Text>
              </View>
            ) : null}
            {isOpen !== undefined ? (
              <View style={styles.metaItem}>
                <Clock size={11} color={isOpen ? theme.system_success : theme.system_error} />
                <Text
                  style={[
                    styles.metaText,
                    {
                      fontFamily: theme.font_body,
                      color: isOpen ? theme.system_success : theme.system_error,
                    },
                  ]}
                >
                  {isOpen
                    ? `Open${venue.openingHours?.closesAt ? ` · Closes ${venue.openingHours.closesAt}` : ''}`
                    : 'Closed'}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Dietary tags */}
        {!compact && venue.dietaryTags.length > 0 ? (
          <View style={styles.tagsRow}>
            {venue.dietaryTags.slice(0, 3).map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="sm"
                style={styles.dietaryTag}
              />
            ))}
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 160,
  },
  content: {
    padding: 14,
    gap: 6,
  },
  contentCompact: {
    flex: 1,
    padding: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  name: {
    flex: 1,
    fontWeight: '700',
  },
  trendBadge: {
    flexShrink: 0,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
  },
  priceLevel: {
    fontSize: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  dietaryTag: {},
});
