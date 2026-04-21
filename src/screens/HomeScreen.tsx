import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@theme/useTheme';
import { Badge } from '@components/atoms/Badge';
import { Avatar } from '@components/atoms/Avatar';
import { tripsApi, socialApi } from '@services/apiClient';
import { useCurrentUser } from '@stores/userStore';
import type { Trip } from '@/types';

const { width } = Dimensions.get('window');

// ─── Fallback mock data (shown when offline or no data yet) ──────────────────

const MOCK_ACTIVE_TRIP = {
  id: '1',
  destination: 'Tokyo, Japan',
  startDate: '2026-04-20',
  endDate: '2026-04-28',
  durationDays: 9,
  currentDay: 2,
  budgetAmount: 2500,
  budgetCurrency: 'GBP',
  totalSpent: 820,
};

const MOCK_RECENT_TRIPS = [
  { id: '2', destination: 'Paris, France', durationDays: 5, status: 'archived' as const },
  { id: '3', destination: 'Barcelona, Spain', durationDays: 7, status: 'archived' as const },
];

const MOCK_TRENDING = [
  { id: '1', city: 'Kyoto', country: 'Japan', emoji: '⛩️', trendScore: 92, tag: 'Cherry Blossom Season' },
  { id: '2', city: 'Lisbon', country: 'Portugal', emoji: '🌊', trendScore: 87, tag: 'Best Spring Vibes' },
  { id: '3', city: 'Seoul', country: 'South Korea', emoji: '🏙️', trendScore: 84, tag: 'K-Culture Boom' },
  { id: '4', city: 'Marrakech', country: 'Morocco', emoji: '🕌', trendScore: 79, tag: 'Hidden Gem' },
];

const QUICK_ACTIONS = [
  { id: 'new-trip', label: 'New Trip', emoji: '✈️', color: '#A3E635' },
  { id: 'translate', label: 'Translate', emoji: '🌐', color: '#67E8F9' },
  { id: 'transport', label: 'Transport', emoji: '🚆', color: '#FB923C' },
  { id: 'budget', label: 'Budget', emoji: '💰', color: '#C084FC' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrendingDest {
  id: string;
  city: string;
  country: string;
  emoji: string;
  trendScore: number;
  tag: string;
}

const DEST_EMOJIS: Record<string, string> = {
  Japan: '⛩️', Portugal: '🌊', 'South Korea': '🏙️', Morocco: '🕌',
  France: '🗼', Spain: '🌞', Italy: '🍕', Thailand: '🐘',
  Vietnam: '🍜', Indonesia: '🌴', Greece: '🏛️', Turkey: '🕌',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function HomeScreen(): React.ReactElement {
  const { theme } = useTheme();
  const currentUser = useCurrentUser();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [trending, setTrending] = useState<TrendingDest[]>(MOCK_TRENDING);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setTripsLoading(true);

    try {
      const [tripResult, trendResult] = await Promise.allSettled([
        tripsApi.list(),
        socialApi.getTrending({ limit: 4 }),
      ]);

      if (tripResult.status === 'fulfilled') {
        setTrips(tripResult.value);
        setIsOffline(false);
      } else {
        setIsOffline(true);
      }

      if (trendResult.status === 'fulfilled' && trendResult.value.length > 0) {
        setTrending(
          trendResult.value.map((d, i) => ({
            id: String(i),
            city: d.city,
            country: d.country,
            emoji: DEST_EMOJIS[d.country] ?? '🌍',
            trendScore: d.trendScore,
            tag: d.topTag,
          }))
        );
      }
    } finally {
      setTripsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Derive display data
  const activeTrip = trips.find((t) => t.status === 'active') ?? null;
  const recentTrips = trips.filter((t) => t.status === 'archived').slice(0, 5);

  // Use API data or fall back to mock when offline
  const displayActiveTrip = activeTrip ?? (isOffline ? MOCK_ACTIVE_TRIP : null);
  const displayRecentTrips = recentTrips.length > 0
    ? recentTrips.map((t) => ({ id: t.id, destination: t.destination, durationDays: t.durationDays, status: t.status }))
    : (isOffline ? MOCK_RECENT_TRIPS : []);

  const budgetSpentPct = displayActiveTrip
    ? Math.min((displayActiveTrip.totalSpent / displayActiveTrip.budgetAmount) * 100, 100)
    : 0;

  const greeting = (): string => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning 👋';
    if (h < 18) return 'Good afternoon 👋';
    return 'Good evening 👋';
  };

  const userInitials = currentUser?.displayName
    ? currentUser.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'ET';

  return (
    <View style={[styles.container, { backgroundColor: theme.bg_primary }]}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: theme.space_md }]}>
          <View>
            <Text style={[styles.greeting, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
              {greeting()}
            </Text>
            <Text style={[styles.userName, { color: theme.text_primary, fontFamily: theme.font_display }]}>
              {currentUser?.displayName ? `Hey, ${currentUser.displayName.split(' ')[0]}!` : 'Ready to explore?'}
            </Text>
          </View>
          <Avatar
            size={40}
            initials={userInitials}
            backgroundColor={theme.brand_lime}
            textColor={theme.bg_primary}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
              tintColor={theme.brand_lime}
            />
          }
        >
          {/* Offline banner */}
          {isOffline && (
            <View style={[styles.offlineBanner, { backgroundColor: `${theme.system_warning}20`, marginHorizontal: theme.space_md }]}>
              <Text style={[styles.offlineText, { color: theme.system_warning, fontFamily: theme.font_body }]}>
                📡 You're offline — showing cached data
              </Text>
            </View>
          )}

          {/* Active Trip Card */}
          <View style={{ paddingHorizontal: theme.space_md }}>
            {tripsLoading ? (
              <View style={[styles.activeTripCard, styles.loadingCard, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}>
                <ActivityIndicator color={theme.brand_lime} />
                <Text style={[{ color: theme.text_secondary, fontFamily: theme.font_body, fontSize: 14, marginTop: 8 }]}>
                  Loading your trips…
                </Text>
              </View>
            ) : displayActiveTrip ? (
              <View
                style={[
                  styles.activeTripCard,
                  { backgroundColor: theme.bg_surface, borderColor: theme.border_default },
                ]}
              >
                <LinearGradient
                  colors={['rgba(163,230,53,0.12)', 'transparent']}
                  style={styles.activeTripGradient}
                />
                <View style={styles.activeTripHeader}>
                  <View style={{ flex: 1 }}>
                    <Badge label="Active Trip" variant="success" size="sm" />
                    <Text
                      style={[
                        styles.activeTripDest,
                        { color: theme.text_primary, fontFamily: theme.font_display, marginTop: 8 },
                      ]}
                      numberOfLines={1}
                    >
                      {displayActiveTrip.destination}
                    </Text>
                    <Text style={[styles.activeTripDates, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                      {displayActiveTrip.startDate} – {displayActiveTrip.endDate} · {displayActiveTrip.durationDays} days
                    </Text>
                  </View>
                  <View style={[styles.dayCounter, { backgroundColor: theme.brand_lime }]}>
                    <Text style={[styles.dayCounterNum, { color: theme.bg_primary, fontFamily: theme.font_display }]}>
                      {(displayActiveTrip as typeof MOCK_ACTIVE_TRIP).currentDay ?? '–'}
                    </Text>
                    <Text style={[styles.dayCounterLabel, { color: theme.bg_primary, fontFamily: theme.font_body }]}>
                      of {displayActiveTrip.durationDays}
                    </Text>
                  </View>
                </View>

                <View style={[styles.budgetRow, { backgroundColor: theme.bg_raised, borderRadius: theme.radius_md }]}>
                  <View>
                    <Text style={[styles.budgetLabel, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                      Budget spent
                    </Text>
                    <Text style={[styles.budgetValue, { color: theme.text_primary, fontFamily: theme.font_body_medium }]}>
                      {displayActiveTrip.budgetCurrency} {displayActiveTrip.totalSpent} / {displayActiveTrip.budgetAmount}
                    </Text>
                  </View>
                  <View style={[styles.miniBar, { backgroundColor: theme.bg_primary }]}>
                    <View
                      style={[
                        styles.miniBarFill,
                        {
                          width: `${budgetSpentPct}%` as any,
                          backgroundColor: budgetSpentPct > 90 ? theme.system_error : theme.brand_lime,
                        },
                      ]}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.viewTripBtn, { backgroundColor: theme.interactive_primary }]}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.viewTripBtnText, { color: theme.text_inverse, fontFamily: theme.font_body_medium }]}>
                    View Itinerary →
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.emptyTripCard, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}>
                <Text style={{ fontSize: 32 }}>✈️</Text>
                <Text style={[styles.emptyTripTitle, { color: theme.text_primary, fontFamily: theme.font_display }]}>
                  No active trip
                </Text>
                <Text style={[styles.emptyTripSub, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                  Plan your next adventure below
                </Text>
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View style={{ paddingHorizontal: theme.space_md }}>
            <Text style={[styles.sectionTitle, { color: theme.text_primary, fontFamily: theme.font_display }]}>
              Quick Actions
            </Text>
            <View style={styles.quickActionsGrid}>
              {QUICK_ACTIONS.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={[
                    styles.quickAction,
                    { backgroundColor: theme.bg_surface, borderColor: theme.border_default },
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}20` }]}>
                    <Text style={styles.quickActionEmoji}>{action.emoji}</Text>
                  </View>
                  <Text style={[styles.quickActionLabel, { color: theme.text_primary, fontFamily: theme.font_body }]}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recent Trips */}
          {(displayRecentTrips.length > 0 || tripsLoading) && (
            <View>
              <View style={[styles.rowHeader, { paddingHorizontal: theme.space_md }]}>
                <Text style={[styles.sectionTitle, { color: theme.text_primary, fontFamily: theme.font_display }]}>
                  Past Trips
                </Text>
                <TouchableOpacity>
                  <Text style={[styles.seeAll, { color: theme.brand_cyan, fontFamily: theme.font_body }]}>
                    See all
                  </Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.horizontalScroll, { paddingHorizontal: theme.space_md }]}
              >
                {displayRecentTrips.map((trip) => (
                  <View key={trip.id} style={[styles.pastTripCard, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}>
                    <View style={[styles.pastTripCover, { backgroundColor: theme.bg_raised }]}>
                      <Text style={styles.pastTripEmoji}>🌍</Text>
                    </View>
                    <Text style={[styles.pastTripDest, { color: theme.text_primary, fontFamily: theme.font_body_medium }]} numberOfLines={1}>
                      {trip.destination}
                    </Text>
                    <Text style={[styles.pastTripDays, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                      {trip.durationDays} days
                    </Text>
                  </View>
                ))}
                <TouchableOpacity
                  style={[styles.newTripCard, { backgroundColor: theme.bg_surface, borderColor: theme.border_default, borderStyle: 'dashed' }]}
                >
                  <Text style={{ fontSize: 24 }}>➕</Text>
                  <Text style={[styles.pastTripDest, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                    New Trip
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {/* Trending Destinations */}
          <View style={{ paddingHorizontal: theme.space_md, paddingBottom: 24 }}>
            <View style={styles.rowHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text_primary, fontFamily: theme.font_display }]}>
                Trending Now 🔥
              </Text>
              <Badge label="Live" variant="error" size="sm" />
            </View>
            {trending.map((dest) => (
              <TouchableOpacity
                key={dest.id}
                style={[
                  styles.trendingItem,
                  { backgroundColor: theme.bg_surface, borderColor: theme.border_default },
                ]}
                activeOpacity={0.8}
              >
                <View style={[styles.trendingEmoji, { backgroundColor: theme.bg_raised }]}>
                  <Text style={{ fontSize: 24 }}>{dest.emoji}</Text>
                </View>
                <View style={styles.trendingInfo}>
                  <Text style={[styles.trendingCity, { color: theme.text_primary, fontFamily: theme.font_body_medium }]}>
                    {dest.city}
                    <Text style={{ color: theme.text_secondary, fontWeight: '400' }}>, {dest.country}</Text>
                  </Text>
                  <Text style={[styles.trendingTag, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                    {dest.tag}
                  </Text>
                </View>
                <View style={[styles.trendScore, { backgroundColor: `${theme.brand_coral}20` }]}>
                  <Text style={[styles.trendScoreText, { color: theme.brand_coral, fontFamily: theme.font_display }]}>
                    {dest.trendScore}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  greeting: { fontSize: 13, marginBottom: 2 },
  userName: { fontSize: 22, fontWeight: '700' },
  scrollContent: { gap: 24, paddingTop: 8 },
  offlineBanner: {
    borderRadius: 10,
    padding: 10,
  },
  offlineText: { fontSize: 13, textAlign: 'center' },
  activeTripCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    overflow: 'hidden',
  },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  activeTripGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  activeTripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  activeTripDest: { fontSize: 20, fontWeight: '700' },
  activeTripDates: { fontSize: 13, marginTop: 2 },
  dayCounter: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  dayCounterNum: { fontSize: 22, fontWeight: '800' },
  dayCounterLabel: { fontSize: 10, marginTop: -2 },
  budgetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  budgetLabel: { fontSize: 12 },
  budgetValue: { fontSize: 14 },
  miniBar: { width: 80, height: 6, borderRadius: 3, overflow: 'hidden' },
  miniBarFill: { height: '100%', borderRadius: 3 },
  viewTripBtn: { height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  viewTripBtnText: { fontSize: 15 },
  emptyTripCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderStyle: 'dashed',
  },
  emptyTripTitle: { fontSize: 16, fontWeight: '700' },
  emptyTripSub: { fontSize: 13 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  seeAll: { fontSize: 13 },
  quickActionsGrid: { flexDirection: 'row', gap: 10 },
  quickAction: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickActionEmoji: { fontSize: 22 },
  quickActionLabel: { fontSize: 11, textAlign: 'center' },
  horizontalScroll: { gap: 12, paddingRight: 24 },
  pastTripCard: {
    width: 130,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pastTripCover: { height: 80, alignItems: 'center', justifyContent: 'center' },
  pastTripEmoji: { fontSize: 32 },
  pastTripDest: { fontSize: 13, padding: 8, paddingBottom: 2 },
  pastTripDays: { fontSize: 11, paddingHorizontal: 8, paddingBottom: 8 },
  newTripCard: {
    width: 130,
    height: 116,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
    marginBottom: 10,
  },
  trendingEmoji: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendingInfo: { flex: 1 },
  trendingCity: { fontSize: 15 },
  trendingTag: { fontSize: 12, marginTop: 2 },
  trendScore: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendScoreText: { fontSize: 16, fontWeight: '700' },
});
