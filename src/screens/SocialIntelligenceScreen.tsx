import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@theme/useTheme';
import { TrendScoreIndicator } from '@components/organisms/TrendScoreIndicator';
import { PremiumBadge } from '@components/molecules/PremiumBadge';
import { Badge } from '@components/atoms/Badge';
import { Button } from '@components/atoms/Button';
import type { SocialPost, ContentType, SocialPlatform } from '@/types';

const MOCK_POSTS: SocialPost[] = [
  {
    id: '1', platform: 'instagram', platformPostId: null, postUrl: null,
    title: 'Hidden temple in Shinjuku you never knew existed',
    contentSnippet: 'Most tourists walk right past this tiny shrine tucked behind a convenience store. The contrast is surreal — ancient stone gates 5 metres from a 7-Eleven.',
    destination: 'Tokyo', city: 'Tokyo', countryCode: 'JP',
    venueId: null, venue: null,
    creatorUsername: 'tokyowanderer', creatorDisplayName: 'Tokyo Wanderer',
    creatorFollowerCount: 387000, creatorVerified: true,
    likesCount: 42300, viewsCount: 980000, commentsCount: 1240, sharesCount: 8900,
    contentType: 'hidden_gem', sentiment: 'positive',
    trendScore: 94, postedAt: '2026-04-19T10:00:00Z',
    crawledAt: '', thumbnailUrl: null,
    extractionConfidence: 'high', createdAt: '', updatedAt: '',
  },
  {
    id: '2', platform: 'tiktok', platformPostId: null, postUrl: null,
    title: 'Tokyo ramen prices in 2026 — honest breakdown',
    contentSnippet: 'Forget the tourist traps. I found 3 ramen spots under ¥1,000 that locals actually eat at. Location matters more than TripAdvisor stars.',
    destination: 'Tokyo', city: 'Tokyo', countryCode: 'JP',
    venueId: null, venue: null,
    creatorUsername: 'cheapeatsasia', creatorDisplayName: 'Cheap Eats Asia',
    creatorFollowerCount: 1200000, creatorVerified: true,
    likesCount: 88000, viewsCount: 2400000, commentsCount: 3100, sharesCount: 22000,
    contentType: 'pricing_intel', sentiment: 'positive',
    trendScore: 87, postedAt: '2026-04-18T14:00:00Z',
    crawledAt: '', thumbnailUrl: null,
    extractionConfidence: 'high', createdAt: '', updatedAt: '',
  },
  {
    id: '3', platform: 'youtube', platformPostId: null, postUrl: null,
    title: 'Shibuya Scramble is broken — here\'s where to actually go',
    contentSnippet: 'The crossing is overcrowded in 2026. The real experience is now 3 blocks east at the underrated Daikanyama side streets.',
    destination: 'Tokyo', city: 'Tokyo', countryCode: 'JP',
    venueId: null, venue: null,
    creatorUsername: 'nipponnomad', creatorDisplayName: 'Nippon Nomad',
    creatorFollowerCount: 620000, creatorVerified: false,
    likesCount: 31000, viewsCount: 890000, commentsCount: 2400, sharesCount: 12000,
    contentType: 'travel_tip', sentiment: 'neutral',
    trendScore: 79, postedAt: '2026-04-17T09:00:00Z',
    crawledAt: '', thumbnailUrl: null,
    extractionConfidence: 'medium', createdAt: '', updatedAt: '',
  },
  {
    id: '4', platform: 'reddit', platformPostId: null, postUrl: null,
    title: '⚠️ JR Pass no longer worth it for short trips',
    contentSnippet: 'Prices went up 40% in 2023 and most short-stay visitors to Tokyo are better off with IC cards. Do the math before buying.',
    destination: 'Tokyo', city: 'Tokyo', countryCode: 'JP',
    venueId: null, venue: null,
    creatorUsername: 'japantravel_mod', creatorDisplayName: 'r/JapanTravel',
    creatorFollowerCount: 890000, creatorVerified: true,
    likesCount: 15400, viewsCount: 440000, commentsCount: 890, sharesCount: 4200,
    contentType: 'warning', sentiment: 'negative',
    trendScore: 72, postedAt: '2026-04-16T16:00:00Z',
    crawledAt: '', thumbnailUrl: null,
    extractionConfidence: 'high', createdAt: '', updatedAt: '',
  },
];

const CONTENT_FILTERS: { value: ContentType | 'all'; label: string; emoji: string }[] = [
  { value: 'all', label: 'All', emoji: '🌐' },
  { value: 'hidden_gem', label: 'Gems', emoji: '💎' },
  { value: 'pricing_intel', label: 'Prices', emoji: '💰' },
  { value: 'travel_tip', label: 'Tips', emoji: '💡' },
  { value: 'influencer_pick', label: 'Picks', emoji: '⭐' },
  { value: 'warning', label: 'Warnings', emoji: '⚠️' },
];

type SortMode = 'trend' | 'recent' | 'followers';

const PLATFORM_EMOJI: Record<SocialPlatform, string> = {
  instagram: '📸',
  tiktok: '🎵',
  youtube: '▶️',
  twitter: '🐦',
  facebook: '👤',
  reddit: '🟠',
  blog: '📝',
  review_site: '⭐',
};

const CONTENT_COLORS: Record<string, string> = {
  hidden_gem: '#A3E635',
  pricing_intel: '#FBBF24',
  travel_tip: '#67E8F9',
  influencer_pick: '#C084FC',
  warning: '#F87171',
  general: '#94A3B8',
};

export function SocialIntelligenceScreen(): React.ReactElement {
  const { theme } = useTheme();
  const [contentFilter, setContentFilter] = useState<ContentType | 'all'>('all');
  const [sortMode, setSortMode] = useState<SortMode>('trend');
  const isPro = true; // PRO ONLY screen — assume pro

  const filtered = MOCK_POSTS
    .filter((p) => contentFilter === 'all' || p.contentType === contentFilter)
    .sort((a, b) => {
      if (sortMode === 'trend') return (b.trendScore ?? 0) - (a.trendScore ?? 0);
      if (sortMode === 'followers') return (b.creatorFollowerCount ?? 0) - (a.creatorFollowerCount ?? 0);
      return new Date(b.postedAt ?? '').getTime() - new Date(a.postedAt ?? '').getTime();
    });

  return (
    <View style={[styles.container, { backgroundColor: theme.bg_primary }]}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: theme.space_md }]}>
          <View>
            <View style={styles.titleRow}>
              <Text style={[styles.headerTitle, { color: theme.text_primary, fontFamily: theme.font_display }]}>
                Social Intel
              </Text>
              <PremiumBadge tier="nomad_pro" />
            </View>
            <Text style={[styles.headerSub, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
              Tokyo · Live from the internet
            </Text>
          </View>
          <View style={[styles.liveIndicator, { backgroundColor: `${theme.system_error}20` }]}>
            <View style={[styles.liveDot, { backgroundColor: theme.system_error }]} />
            <Text style={[styles.liveText, { color: theme.system_error, fontFamily: theme.font_body_medium }]}>
              LIVE
            </Text>
          </View>
        </View>

        {/* Sort controls */}
        <View style={[styles.sortRow, { paddingHorizontal: theme.space_md }]}>
          <Text style={[styles.sortLabel, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
            Sort:
          </Text>
          {(['trend', 'recent', 'followers'] as SortMode[]).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.sortChip,
                {
                  backgroundColor: sortMode === mode ? theme.interactive_primary : theme.bg_surface,
                  borderColor: sortMode === mode ? theme.interactive_primary : theme.border_default,
                },
              ]}
              onPress={() => setSortMode(mode)}
            >
              <Text style={[styles.sortChipText, { color: sortMode === mode ? theme.text_inverse : theme.text_secondary, fontFamily: theme.font_body }]}>
                {mode === 'trend' ? '🔥 Trend' : mode === 'recent' ? '🕐 Recent' : '👥 Followers'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.contentFilters, { paddingHorizontal: theme.space_md }]}
        >
          {CONTENT_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.value}
              style={[
                styles.contentFilterChip,
                {
                  backgroundColor: contentFilter === f.value ? `${theme.brand_lime}20` : theme.bg_surface,
                  borderColor: contentFilter === f.value ? theme.brand_lime : theme.border_default,
                },
              ]}
              onPress={() => setContentFilter(f.value)}
            >
              <Text>{f.emoji}</Text>
              <Text style={[styles.contentFilterText, { color: contentFilter === f.value ? theme.brand_lime : theme.text_secondary, fontFamily: theme.font_body }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: theme.space_md }]}
          showsVerticalScrollIndicator={false}
        >
          {filtered.map((post) => {
            const contentColor = CONTENT_COLORS[post.contentType ?? 'general'] ?? theme.text_secondary;
            return (
              <View
                key={post.id}
                style={[styles.postCard, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}
              >
                {/* Content type bar */}
                <View style={[styles.postTypeBar, { backgroundColor: contentColor }]} />

                <View style={styles.postBody}>
                  {/* Platform + creator */}
                  <View style={styles.postHeader}>
                    <Text style={styles.platformEmoji}>{PLATFORM_EMOJI[post.platform]}</Text>
                    <View style={styles.creatorInfo}>
                      <Text style={[styles.creatorName, { color: theme.text_primary, fontFamily: theme.font_body_medium }]}>
                        {post.creatorDisplayName}
                        {post.creatorVerified && <Text style={{ color: theme.brand_cyan }}> ✓</Text>}
                      </Text>
                      <Text style={[styles.creatorHandle, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                        @{post.creatorUsername} · {((post.creatorFollowerCount ?? 0) / 1000).toFixed(0)}K
                      </Text>
                    </View>
                    {post.trendScore !== null && (
                      <TrendScoreIndicator score={post.trendScore} size="sm" showLabel={false} />
                    )}
                  </View>

                  {/* Title */}
                  {post.title && (
                    <Text style={[styles.postTitle, { color: theme.text_primary, fontFamily: theme.font_body_medium }]}>
                      {post.title}
                    </Text>
                  )}

                  {/* Snippet */}
                  {post.contentSnippet && (
                    <Text style={[styles.postSnippet, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                      {post.contentSnippet}
                    </Text>
                  )}

                  {/* Stats */}
                  <View style={styles.postStats}>
                    <Text style={[styles.stat, { color: theme.text_disabled, fontFamily: theme.font_body }]}>
                      ❤️ {(post.likesCount / 1000).toFixed(1)}K
                    </Text>
                    <Text style={[styles.stat, { color: theme.text_disabled, fontFamily: theme.font_body }]}>
                      👁️ {(post.viewsCount / 1000).toFixed(0)}K
                    </Text>
                    <Text style={[styles.stat, { color: theme.text_disabled, fontFamily: theme.font_body }]}>
                      💬 {post.commentsCount.toLocaleString()}
                    </Text>
                    {post.postedAt && (
                      <Text style={[styles.stat, { color: theme.text_disabled, fontFamily: theme.font_body }]}>
                        · {new Date(post.postedAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>

                  {/* Content type badge */}
                  <View style={[styles.contentTypeBadge, { backgroundColor: `${contentColor}20` }]}>
                    <Text style={[styles.contentTypeBadgeText, { color: contentColor, fontFamily: theme.font_body_medium }]}>
                      {CONTENT_FILTERS.find((f) => f.value === post.contentType)?.emoji}{' '}
                      {post.contentType?.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}

          <View style={{ height: 32 }} />
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
    alignItems: 'flex-start',
    paddingTop: 8,
    paddingBottom: 16,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  headerSub: { fontSize: 13, marginTop: 4 },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 11 },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sortLabel: { fontSize: 13 },
  sortChip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sortChipText: { fontSize: 12 },
  contentFilters: { gap: 8, paddingBottom: 12 },
  contentFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  contentFilterText: { fontSize: 12 },
  scrollContent: { gap: 12, paddingTop: 4 },
  postCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  postTypeBar: { width: 4 },
  postBody: { flex: 1, padding: 14, gap: 8 },
  postHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  platformEmoji: { fontSize: 20, marginTop: 2 },
  creatorInfo: { flex: 1 },
  creatorName: { fontSize: 14 },
  creatorHandle: { fontSize: 12, marginTop: 1 },
  postTitle: { fontSize: 14, lineHeight: 20 },
  postSnippet: { fontSize: 13, lineHeight: 18 },
  postStats: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  stat: { fontSize: 11 },
  contentTypeBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  contentTypeBadgeText: { fontSize: 11, textTransform: 'capitalize' },
});
