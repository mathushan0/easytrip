import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'react-native-linear-gradient';
import { useTheme } from '@theme/useTheme';
import { useUserStore } from '@stores/userStore';
import { Avatar } from '@components/atoms/Avatar';
import { TripCard } from '@components/molecules/TripCard';
import type { Trip, UserAchievement } from '@/types';

const { width } = Dimensions.get('window');

// ─── Mock data ─────────────────────────────────────────────────────────────

const MOCK_USER = {
  displayName: 'Mathu T.',
  email: 'mathu@example.com',
  avatarUrl: null as string | null,
  totalTrips: 14,
  totalDays: 78,
  totalTasksCompleted: 312,
  countriesVisited: ['JP', 'FR', 'ES', 'PT', 'IT', 'TH', 'DE', 'NL', 'US', 'MX', 'CO', 'VN'],
};

const MOCK_PAST_TRIPS: Trip[] = [
  {
    id: 'p1',
    userId: 'u1',
    destination: 'Tokyo, Japan',
    countryCode: 'JP',
    city: 'Tokyo',
    destinationLat: 35.6762,
    destinationLng: 139.6503,
    startDate: '2026-04-20',
    endDate: '2026-04-28',
    durationDays: 9,
    timezone: 'Asia/Tokyo',
    budgetAmount: 2500,
    budgetCurrency: 'GBP',
    tripType: 'solo',
    travelPreferences: null,
    aiModelUsed: null,
    generationPromptVersion: null,
    destinationConfidence: 'high',
    status: 'active',
    shareToken: null,
    isShared: false,
    coverPhotoUrl: null,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
  },
  {
    id: 'p2',
    userId: 'u1',
    destination: 'Paris, France',
    countryCode: 'FR',
    city: 'Paris',
    destinationLat: 48.8566,
    destinationLng: 2.3522,
    startDate: '2025-11-10',
    endDate: '2025-11-17',
    durationDays: 7,
    timezone: 'Europe/Paris',
    budgetAmount: 1800,
    budgetCurrency: 'GBP',
    tripType: 'couple',
    travelPreferences: null,
    aiModelUsed: null,
    generationPromptVersion: null,
    destinationConfidence: 'high',
    status: 'archived',
    shareToken: null,
    isShared: false,
    coverPhotoUrl: null,
    createdAt: '2025-10-15T00:00:00Z',
    updatedAt: '2025-11-17T00:00:00Z',
  },
  {
    id: 'p3',
    userId: 'u1',
    destination: 'Barcelona, Spain',
    countryCode: 'ES',
    city: 'Barcelona',
    destinationLat: 41.3851,
    destinationLng: 2.1734,
    startDate: '2025-08-03',
    endDate: '2025-08-10',
    durationDays: 7,
    timezone: 'Europe/Madrid',
    budgetAmount: 1500,
    budgetCurrency: 'GBP',
    tripType: 'group',
    travelPreferences: null,
    aiModelUsed: null,
    generationPromptVersion: null,
    destinationConfidence: 'high',
    status: 'archived',
    shareToken: null,
    isShared: false,
    coverPhotoUrl: null,
    createdAt: '2025-07-10T00:00:00Z',
    updatedAt: '2025-08-10T00:00:00Z',
  },
  {
    id: 'p4',
    userId: 'u1',
    destination: 'Lisbon, Portugal',
    countryCode: 'PT',
    city: 'Lisbon',
    destinationLat: 38.7223,
    destinationLng: -9.1393,
    startDate: '2025-05-22',
    endDate: '2025-05-27',
    durationDays: 5,
    timezone: 'Europe/Lisbon',
    budgetAmount: 1100,
    budgetCurrency: 'GBP',
    tripType: 'solo',
    travelPreferences: null,
    aiModelUsed: null,
    generationPromptVersion: null,
    destinationConfidence: 'high',
    status: 'archived',
    shareToken: null,
    isShared: false,
    coverPhotoUrl: null,
    createdAt: '2025-05-01T00:00:00Z',
    updatedAt: '2025-05-27T00:00:00Z',
  },
];

const MOCK_ACHIEVEMENTS: UserAchievement[] = [
  {
    achievement: {
      id: 'a1',
      name: 'First Flight',
      description: 'Created your first trip',
      icon: '✈️',
      tierRequired: 'explorer',
      createdAt: '2025-01-01T00:00:00Z',
    },
    earnedAt: '2024-09-15T00:00:00Z',
  },
  {
    achievement: {
      id: 'a2',
      name: 'Globe Trotter',
      description: 'Visited 10 countries',
      icon: '🌍',
      tierRequired: 'explorer',
      createdAt: '2025-01-01T00:00:00Z',
    },
    earnedAt: '2025-03-20T00:00:00Z',
  },
  {
    achievement: {
      id: 'a3',
      name: 'Century Task',
      description: 'Completed 100 tasks',
      icon: '💯',
      tierRequired: 'explorer',
      createdAt: '2025-01-01T00:00:00Z',
    },
    earnedAt: '2025-06-01T00:00:00Z',
  },
  {
    achievement: {
      id: 'a4',
      name: 'Foodie',
      description: 'Visited 20 restaurants',
      icon: '🍜',
      tierRequired: 'explorer',
      createdAt: '2025-01-01T00:00:00Z',
    },
    earnedAt: '2025-07-12T00:00:00Z',
  },
  {
    achievement: {
      id: 'a5',
      name: 'Planner Pro',
      description: 'Created 10+ trips',
      icon: '📋',
      tierRequired: 'voyager',
      createdAt: '2025-01-01T00:00:00Z',
    },
    earnedAt: '2025-10-05T00:00:00Z',
  },
  {
    achievement: {
      id: 'a6',
      name: 'Night Owl',
      description: 'Planned a trip after midnight',
      icon: '🦉',
      tierRequired: 'explorer',
      createdAt: '2025-01-01T00:00:00Z',
    },
    earnedAt: '2025-11-22T00:00:00Z',
  },
];

// ─── Stat card ──────────────────────────────────────────────────────────────

interface StatCardProps {
  value: string;
  label: string;
  emoji: string;
}

function StatCard({ value, label, emoji }: StatCardProps): React.ReactElement {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: theme.bg_surface, borderColor: theme.border_default },
      ]}
    >
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, { fontFamily: theme.font_display, color: theme.text_primary }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { fontFamily: theme.font_body, color: theme.text_secondary }]}>
        {label}
      </Text>
    </View>
  );
}

// ─── Countries map placeholder ─────────────────────────────────────────────

function CountriesMapPlaceholder({ countries, count }: { countries: string[]; count: number }): React.ReactElement {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.mapPlaceholder,
        { backgroundColor: theme.bg_surface, borderColor: theme.border_default },
      ]}
    >
      <LinearGradient
        colors={theme.gradient_primary}
        style={styles.mapGradientBar}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
      <View style={styles.mapContent}>
        <Text style={[styles.mapCountValue, { fontFamily: theme.font_display, color: theme.text_primary }]}>
          {count}
        </Text>
        <Text style={[styles.mapCountLabel, { fontFamily: theme.font_body, color: theme.text_secondary }]}>
          Countries visited
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.flagsRow}
        >
          {countries.map((code) => (
            <Text key={code} style={styles.flagEmoji}>
              {countryCodeToFlag(code)}
            </Text>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

function countryCodeToFlag(code: string): string {
  return code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('');
}

// ─── Achievement badge ─────────────────────────────────────────────────────

function AchievementBadge({ userAchievement }: { userAchievement: UserAchievement }): React.ReactElement {
  const { theme } = useTheme();
  const { achievement, earnedAt } = userAchievement;
  const year = new Date(earnedAt).getFullYear();
  return (
    <TouchableOpacity
      style={[styles.badge, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}
      activeOpacity={0.8}
      accessibilityLabel={`${achievement.name}: ${achievement.description}`}
    >
      <Text style={styles.badgeIcon}>{achievement.icon}</Text>
      <Text
        style={[styles.badgeName, { fontFamily: theme.font_body_medium, color: theme.text_primary }]}
        numberOfLines={2}
      >
        {achievement.name}
      </Text>
      <Text style={[styles.badgeYear, { fontFamily: theme.font_mono, color: theme.text_disabled }]}>
        {year}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────

export function ProfileScreen(): React.ReactElement {
  const { theme } = useTheme();
  const { user } = useUserStore();

  const displayName = user?.displayName ?? MOCK_USER.displayName;
  const avatarUrl = user?.avatarUrl ?? MOCK_USER.avatarUrl;
  const totalTrips = user?.totalTrips ?? MOCK_USER.totalTrips;
  const totalDays = user?.totalDays ?? MOCK_USER.totalDays;
  const totalTasksCompleted = user?.totalTasksCompleted ?? MOCK_USER.totalTasksCompleted;
  const countriesVisited = user?.countriesVisited ?? MOCK_USER.countriesVisited;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  async function handleShareCard(): Promise<void> {
    await Share.share({
      message: `I've visited ${countriesVisited.length} countries and planned ${totalTrips} trips with EasyTrip! ✈️`,
      title: 'My EasyTrip Stats',
    });
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg_primary }]}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ── HERO HEADER ──────────────────────────────────────────── */}
          <LinearGradient
            colors={[theme.bg_primary, theme.bg_surface]}
            style={styles.heroGradient}
          >
            <View style={styles.heroRow}>
              <View style={styles.heroText}>
                <Text style={[styles.greeting, { fontFamily: theme.font_body, color: theme.text_secondary }]}>
                  {greeting} 👋
                </Text>
                <Text style={[styles.displayName, { fontFamily: theme.font_display, color: theme.text_primary }]}>
                  {displayName}
                </Text>
              </View>
              <Avatar uri={avatarUrl} name={displayName} size="xl" showBorder />
            </View>

            {/* Edit profile button */}
            <TouchableOpacity
              style={[styles.editBtn, { borderColor: theme.border_default, backgroundColor: theme.bg_raised }]}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
            >
              <Text style={[styles.editBtnText, { fontFamily: theme.font_body_medium, color: theme.text_primary }]}>
                Edit Profile
              </Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* ── STATS ROW ─────────────────────────────────────────────── */}
          <View style={styles.statsRow}>
            <StatCard value={String(totalTrips)} label="Trips" emoji="✈️" />
            <StatCard value={String(totalDays)} label="Days planned" emoji="📅" />
            <StatCard value={String(totalTasksCompleted)} label="Tasks done" emoji="✅" />
          </View>

          {/* ── COUNTRIES MAP ────────────────────────────────────────── */}
          <View style={styles.sectionContainer}>
            <CountriesMapPlaceholder
              countries={countriesVisited}
              count={countriesVisited.length}
            />
          </View>

          {/* ── PAST TRIPS ───────────────────────────────────────────── */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { fontFamily: theme.font_display, color: theme.text_primary }]}>
              Past Trips
            </Text>
            <View style={styles.tripsList}>
              {MOCK_PAST_TRIPS.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  variant="mini"
                  style={styles.tripCardItem}
                />
              ))}
            </View>
          </View>

          {/* ── ACHIEVEMENTS ─────────────────────────────────────────── */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { fontFamily: theme.font_display, color: theme.text_primary }]}>
              Achievements
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.badgesRow}
            >
              {MOCK_ACHIEVEMENTS.map((ua) => (
                <AchievementBadge key={ua.achievement.id} userAchievement={ua} />
              ))}
            </ScrollView>
          </View>

          {/* ── SHARE CARD ───────────────────────────────────────────── */}
          <View style={[styles.sectionContainer, { paddingBottom: 40 }]}>
            <TouchableOpacity
              style={[styles.shareCard, { borderColor: theme.interactive_primary }]}
              onPress={handleShareCard}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Share your travel stats"
            >
              <LinearGradient
                colors={theme.gradient_cta}
                style={styles.shareCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.shareCardTitle, { fontFamily: theme.font_display, color: theme.bg_primary }]}>
                  Share My Journey
                </Text>
                <Text style={[styles.shareCardSub, { fontFamily: theme.font_body, color: theme.bg_primary }]}>
                  {countriesVisited.length} countries · {totalTrips} trips · {totalDays} days
                </Text>
                <Text style={styles.shareCardCta}>📤 Share Card</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: {},

  heroGradient: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heroText: {
    flex: 1,
    marginRight: 16,
  },
  greeting: {
    fontSize: 15,
    marginBottom: 4,
  },
  displayName: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  editBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  editBtnText: {
    fontSize: 14,
  },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 4,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    alignItems: 'center',
    gap: 2,
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },

  sectionContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 12,
  },

  mapPlaceholder: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  mapGradientBar: {
    height: 3,
    width: '100%',
  },
  mapContent: {
    padding: 20,
    alignItems: 'flex-start',
  },
  mapCountValue: {
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 52,
  },
  mapCountLabel: {
    fontSize: 15,
    marginTop: 2,
    marginBottom: 12,
  },
  flagsRow: {
    flexDirection: 'row',
  },
  flagEmoji: {
    fontSize: 22,
    marginRight: 4,
  },

  tripsList: {
    gap: 8,
  },
  tripCardItem: {
    borderRadius: 12,
  },

  badgesRow: {
    paddingRight: 8,
    gap: 8,
  },
  badge: {
    width: 90,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  badgeIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  badgeName: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
  badgeYear: {
    fontSize: 10,
  },

  shareCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  shareCardGradient: {
    padding: 24,
    gap: 4,
  },
  shareCardTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  shareCardSub: {
    fontSize: 14,
    opacity: 0.85,
  },
  shareCardCta: {
    fontSize: 16,
    marginTop: 12,
    fontWeight: '600',
    color: '#fff',
  },
});
