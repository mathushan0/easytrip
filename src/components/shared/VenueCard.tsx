// ─────────────────────────────────────────────────────────────────────────────
// SHARED — VenueCard
// Photo, name, rating, category chip, price in local currency
// Opens Place Detail sheet on tap
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { Card } from './Card';
import { Chip } from './Chip';
import { useTheme } from '@theme/useTheme';
import { FONT_FAMILIES } from '@theme/fonts';
import type { CategoryKey } from '@/types';

export interface VenueCardProps {
  id: string;
  name: string;
  photoUrl?: string;
  rating?: number;
  priceDisplay?: string;
  category?: CategoryKey;
  onPress?: (id: string) => void;
  style?: ViewStyle;
}

export function VenueCard({
  id,
  name,
  photoUrl,
  rating,
  priceDisplay,
  category,
  onPress,
  style,
}: VenueCardProps): React.ReactElement {
  const { theme } = useTheme();

  return (
    <Card onPress={() => onPress?.(id)} style={[styles.card, style]}>
      {/* Photo */}
      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          style={styles.photo}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.photoPlaceholder, { backgroundColor: theme.bg_raised }]} />
      )}

      <View style={styles.info}>
        {/* Name */}
        <Text
          style={[
            styles.name,
            { color: theme.text_primary, fontFamily: FONT_FAMILIES.fredokaBold },
          ]}
          numberOfLines={1}
        >
          {name}
        </Text>

        <View style={styles.meta}>
          {/* Category chip */}
          {category ? (
            <Chip label={category} category={category} selected style={styles.chip} />
          ) : null}

          {/* Rating */}
          {rating != null ? (
            <Text
              style={[
                styles.rating,
                { color: theme.text_secondary, fontFamily: FONT_FAMILIES.nunitoBold },
              ]}
            >
              ★ {rating.toFixed(1)}
            </Text>
          ) : null}

          {/* Price */}
          {priceDisplay ? (
            <Text
              style={[
                styles.price,
                { color: theme.text_secondary, fontFamily: FONT_FAMILIES.nunitoSemiBold },
              ]}
            >
              {priceDisplay}
            </Text>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 220,
  },
  photo: {
    width: '100%',
    height: 130,
  },
  photoPlaceholder: {
    width: '100%',
    height: 130,
  },
  info: {
    padding: 12,
    gap: 8,
  },
  name: {
    fontSize: 16,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    // small override
  },
  rating: {
    fontSize: 13,
  },
  price: {
    fontSize: 13,
  },
});
