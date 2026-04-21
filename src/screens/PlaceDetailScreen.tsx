import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@theme/useTheme';
import { PhotoCarousel } from '@components/organisms/PhotoCarousel';
import { PeakHoursChart } from '@components/organisms/PeakHoursChart';
import { PremiumBadge } from '@components/molecules/PremiumBadge';
import { Badge } from '@components/atoms/Badge';
import { Button } from '@components/atoms/Button';
import type { Venue, PeakHoursData, TransportMode } from '@/types';

const MOCK_VENUE: Venue = {
  id: 'v1',
  googlePlaceId: 'ChIJsomeId',
  name: 'Shinjuku Gyoen National Garden',
  category: 'landmark',
  subCategory: 'Park & Garden',
  address: '11 Naitomachi, Shinjuku, Tokyo 160-0014',
  city: 'Tokyo',
  countryCode: 'JP',
  lat: 35.6851,
  lng: 139.7100,
  phone: '+81 3-3350-0151',
  website: 'https://www.env.go.jp/garden/shinjukugyoen/',
  googleRating: 4.6,
  googleReviewCount: 48200,
  priceLevel: 1,
  openingHours: {
    monday: ['09:00-17:30'],
    tuesday: ['09:00-17:30'],
    wednesday: ['09:00-17:30'],
    thursday: ['09:00-17:30'],
    friday: ['09:00-17:30'],
    saturday: ['09:00-17:30'],
    sunday: ['09:00-17:30'],
    isOpen: true,
    closesAt: '17:30',
  },
  hoursLastFetchedAt: new Date().toISOString(),
  photos: [
    { url: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800', source: 'unsplash', attribution: 'Unsplash', width: 800, height: 500 },
    { url: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800', source: 'unsplash', attribution: 'Unsplash', width: 800, height: 500 },
    { url: 'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=800', source: 'unsplash', attribution: 'Unsplash', width: 800, height: 500 },
  ],
  estimatedCostLow: 500,
  estimatedCostHigh: 500,
  costCurrency: 'JPY',
  entryFee: 500,
  bookingUrl: null,
  peakHours: {
    monday: [0,0,0,0,0,0,5,15,30,50,65,75,80,85,70,60,50,40,30,15,5,0,0,0],
    tuesday: [0,0,0,0,0,0,5,15,30,50,65,75,80,85,70,60,50,40,30,15,5,0,0,0],
    wednesday: [0,0,0,0,0,0,5,15,30,50,65,75,80,85,70,60,50,40,30,15,5,0,0,0],
    thursday: [0,0,0,0,0,0,5,15,30,50,65,75,80,85,70,60,50,40,30,15,5,0,0,0],
    friday: [0,0,0,0,0,0,5,20,40,60,75,85,90,95,80,70,60,50,35,20,8,0,0,0],
    saturday: [0,0,0,0,0,0,10,30,55,75,90,95,100,95,85,75,65,55,40,25,10,0,0,0],
    sunday: [0,0,0,0,0,0,10,30,55,75,90,95,100,95,85,75,65,55,40,25,10,0,0,0],
  },
  dietaryTags: [],
  createdAt: '',
  updatedAt: '',
};

const MOCK_INFLUENCER_PICKS = [
  { id: '1', creator: '@tokyowanderer', followers: '380K', snippet: 'The French greenhouse is worth every minute — find it in the southwest corner 🌿', platform: 'instagram' },
  { id: '2', creator: '@nipponexplorer', followers: '215K', snippet: 'Cherry blossom season here hits different. Spring is the only time to visit.', platform: 'tiktok' },
];

const TRANSPORT_OPTIONS: { mode: TransportMode; label: string; emoji: string; duration: string; cost: string }[] = [
  { mode: 'metro', label: 'Metro', emoji: '🚇', duration: '8 min', cost: '¥170' },
  { mode: 'walk', label: 'Walk', emoji: '🚶', duration: '22 min', cost: 'Free' },
  { mode: 'taxi', label: 'Taxi', emoji: '🚕', duration: '6 min', cost: '¥700' },
];

export function PlaceDetailScreen(): React.ReactElement {
  const { theme } = useTheme();
  const [selectedTransport, setSelectedTransport] = useState<TransportMode>('metro');
  const isPro = false; // mock non-pro user

  return (
    <View style={[styles.container, { backgroundColor: theme.bg_primary }]}>
      <PhotoCarousel photos={MOCK_VENUE.photos} height={260} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title section */}
        <View style={[styles.titleSection, { paddingHorizontal: theme.space_md }]}>
          <View style={styles.titleRow}>
            <View style={styles.titleInfo}>
              <Text style={[styles.venueName, { color: theme.text_primary, fontFamily: theme.font_display }]}>
                {MOCK_VENUE.name}
              </Text>
              <View style={styles.metaRow}>
                <Text style={[styles.categoryLabel, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                  {MOCK_VENUE.subCategory}
                </Text>
                <Text style={{ color: theme.text_disabled }}>·</Text>
                <Text style={[styles.addressText, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                  {MOCK_VENUE.city}
                </Text>
              </View>
            </View>
          </View>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <View style={[styles.ratingChip, { backgroundColor: `${theme.brand_gold}20` }]}>
              <Text style={[styles.ratingText, { color: theme.brand_gold, fontFamily: theme.font_body_medium }]}>
                ⭐ {MOCK_VENUE.googleRating} · {MOCK_VENUE.googleReviewCount?.toLocaleString()} reviews
              </Text>
            </View>
            {MOCK_VENUE.priceLevel && (
              <View style={[styles.priceChip, { backgroundColor: theme.bg_raised }]}>
                <Text style={[styles.priceText, { color: theme.text_secondary, fontFamily: theme.font_mono }]}>
                  {'¥'.repeat(MOCK_VENUE.priceLevel)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Opening hours */}
        <View style={[styles.card, { backgroundColor: theme.bg_surface, borderColor: theme.border_default, marginHorizontal: theme.space_md }]}>
          <Text style={[styles.cardTitle, { color: theme.text_primary, fontFamily: theme.font_display }]}>
            Opening Hours
          </Text>
          <View style={styles.hoursRow}>
            <View style={[styles.openIndicator, { backgroundColor: MOCK_VENUE.openingHours?.isOpen ? `${theme.system_success}20` : `${theme.system_error}20` }]}>
              <View style={[styles.openDot, { backgroundColor: MOCK_VENUE.openingHours?.isOpen ? theme.system_success : theme.system_error }]} />
              <Text style={[styles.openText, { color: MOCK_VENUE.openingHours?.isOpen ? theme.system_success : theme.system_error, fontFamily: theme.font_body_medium }]}>
                {MOCK_VENUE.openingHours?.isOpen ? 'Open now' : 'Closed'}
              </Text>
            </View>
            <Text style={[styles.closesText, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
              Closes at {MOCK_VENUE.openingHours?.closesAt}
            </Text>
          </View>
          <Text style={[styles.hoursSchedule, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
            Mon–Sun: 09:00 – 17:30
          </Text>
        </View>

        {/* Entry fee */}
        {MOCK_VENUE.entryFee && (
          <View style={[styles.feeRow, { paddingHorizontal: theme.space_md }]}>
            <View style={[styles.feeCard, { backgroundColor: `${theme.brand_cyan}15`, borderColor: theme.brand_cyan }]}>
              <Text style={[styles.feeIcon]}>🎟️</Text>
              <View>
                <Text style={[styles.feeLabel, { color: theme.text_secondary, fontFamily: theme.font_body }]}>Entry Fee</Text>
                <Text style={[styles.feeValue, { color: theme.brand_cyan, fontFamily: theme.font_display }]}>
                  ¥{MOCK_VENUE.entryFee.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Peak hours */}
        {MOCK_VENUE.peakHours && (
          <View style={[styles.card, { backgroundColor: theme.bg_surface, borderColor: theme.border_default, marginHorizontal: theme.space_md }]}>
            <Text style={[styles.cardTitle, { color: theme.text_primary, fontFamily: theme.font_display }]}>
              When to Visit
            </Text>
            <PeakHoursChart data={MOCK_VENUE.peakHours} />
          </View>
        )}

        {/* Transport */}
        <View style={[styles.card, { backgroundColor: theme.bg_surface, borderColor: theme.border_default, marginHorizontal: theme.space_md }]}>
          <Text style={[styles.cardTitle, { color: theme.text_primary, fontFamily: theme.font_display }]}>
            Getting There
          </Text>
          <Text style={[styles.transportFrom, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
            From: Your Hotel, Shinjuku
          </Text>
          <View style={styles.transportOptions}>
            {TRANSPORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.mode}
                style={[
                  styles.transportCard,
                  {
                    backgroundColor: selectedTransport === opt.mode ? `${theme.brand_lime}15` : theme.bg_raised,
                    borderColor: selectedTransport === opt.mode ? theme.brand_lime : theme.border_default,
                  },
                ]}
                onPress={() => setSelectedTransport(opt.mode)}
              >
                <Text style={styles.transportEmoji}>{opt.emoji}</Text>
                <Text style={[styles.transportLabel, { color: theme.text_primary, fontFamily: theme.font_body_medium }]}>
                  {opt.label}
                </Text>
                <Text style={[styles.transportDuration, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                  {opt.duration}
                </Text>
                <Text style={[styles.transportCost, { color: theme.brand_gold, fontFamily: theme.font_body }]}>
                  {opt.cost}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Influencer Picks — PRO */}
        <View style={[styles.card, { backgroundColor: theme.bg_surface, borderColor: theme.border_default, marginHorizontal: theme.space_md }]}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, { color: theme.text_primary, fontFamily: theme.font_display }]}>
              Influencer Picks
            </Text>
            <PremiumBadge tier="nomad_pro" />
          </View>
          {!isPro ? (
            <View style={[styles.proBlur, { backgroundColor: theme.bg_raised }]}>
              <Text style={{ fontSize: 24 }}>🔒</Text>
              <Text style={[styles.proBlurText, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                Unlock Nomad Pro to see what top influencers say about this place
              </Text>
              <Button label="Unlock Pro" variant="primary" size="sm" />
            </View>
          ) : (
            MOCK_INFLUENCER_PICKS.map((pick) => (
              <View key={pick.id} style={[styles.influencerCard, { backgroundColor: theme.bg_raised }]}>
                <Text style={[styles.influencerHandle, { color: theme.brand_cyan, fontFamily: theme.font_body_medium }]}>
                  {pick.creator}
                </Text>
                <Text style={[styles.influencerFollowers, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                  {pick.followers} followers · {pick.platform}
                </Text>
                <Text style={[styles.influencerSnippet, { color: theme.text_primary, fontFamily: theme.font_body }]}>
                  "{pick.snippet}"
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Add to Day */}
        <View style={[styles.ctaSection, { paddingHorizontal: theme.space_md, paddingBottom: 32 }]}>
          <Button label="+ Add to Day" variant="primary" size="lg" fullWidth />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { gap: 16, paddingTop: 16, paddingBottom: 16 },
  titleSection: { gap: 10 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleInfo: { flex: 1, gap: 4 },
  venueName: { fontSize: 22, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  categoryLabel: { fontSize: 13 },
  addressText: { fontSize: 13 },
  ratingRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  ratingChip: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  ratingText: { fontSize: 13 },
  priceChip: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  priceText: { fontSize: 13 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hoursRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  openIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  openDot: { width: 8, height: 8, borderRadius: 4 },
  openText: { fontSize: 13 },
  closesText: { fontSize: 13 },
  hoursSchedule: { fontSize: 13 },
  feeRow: {},
  feeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  feeIcon: { fontSize: 24 },
  feeLabel: { fontSize: 12, marginBottom: 2 },
  feeValue: { fontSize: 18, fontWeight: '700' },
  transportFrom: { fontSize: 13 },
  transportOptions: { flexDirection: 'row', gap: 8 },
  transportCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  transportEmoji: { fontSize: 22 },
  transportLabel: { fontSize: 12 },
  transportDuration: { fontSize: 11 },
  transportCost: { fontSize: 11 },
  proBlur: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  proBlurText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  influencerCard: { borderRadius: 12, padding: 12, gap: 4 },
  influencerHandle: { fontSize: 14 },
  influencerFollowers: { fontSize: 12 },
  influencerSnippet: { fontSize: 13, lineHeight: 18, marginTop: 4, fontStyle: 'italic' },
  ctaSection: {},
});
