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
import { useTheme } from '@theme/useTheme';
import { FilterBar } from '@components/molecules/FilterBar';
import { VenueCard } from '@components/molecules/VenueCard';
import { PremiumBadge } from '@components/molecules/PremiumBadge';
import { SearchBar } from '@components/molecules/SearchBar';
import { Badge } from '@components/atoms/Badge';

const { width } = Dimensions.get('window');

const FILTERS = ['All', 'Ramen', 'Sushi', 'Izakaya', 'Breakfast', 'Street Food', 'Vegetarian'];

const MOCK_RESTAURANTS = [
  {
    id: 'r1',
    name: 'Ichiran Shinjuku',
    category: 'Ramen',
    rating: 4.5,
    reviewCount: 12400,
    priceLevel: 2,
    tags: ['Solo dining', 'Late night'],
    isCelebPick: true,
    celebName: 'David Chang',
    description: 'World-famous solo-booth ramen with rich tonkotsu broth.',
    openNow: true,
    estimatedWait: '15 min',
    emoji: '🍜',
  },
  {
    id: 'r2',
    name: 'Tsukiji Sushi Ko',
    category: 'Sushi',
    rating: 4.8,
    reviewCount: 8900,
    priceLevel: 3,
    tags: ['Omakase', 'Fresh catch'],
    isCelebPick: false,
    celebName: null,
    description: 'Omakase counter with daily Tsukiji market fish. Book ahead.',
    openNow: true,
    estimatedWait: null,
    emoji: '🍣',
  },
  {
    id: 'r3',
    name: 'Omoide Yokocho',
    category: 'Izakaya',
    rating: 4.3,
    reviewCount: 22000,
    priceLevel: 2,
    tags: ['Atmospheric', 'Yakitori', 'Standing bar'],
    isCelebPick: true,
    celebName: 'Anthony Bourdain',
    description: 'Legendary "Memory Lane" — tiny smoky yakitori stalls since the 1940s.',
    openNow: true,
    estimatedWait: null,
    emoji: '🏮',
  },
  {
    id: 'r4',
    name: 'Hoshino Coffee',
    category: 'Breakfast',
    rating: 4.4,
    reviewCount: 5200,
    priceLevel: 2,
    tags: ['Coffee', 'Toast', 'Breakfast'],
    isCelebPick: false,
    celebName: null,
    description: 'Beloved Japanese-style cafe known for thick toast and drip coffee.',
    openNow: true,
    estimatedWait: '5 min',
    emoji: '☕',
  },
];

const LOCAL_DISHES = [
  { name: 'Tonkotsu Ramen', desc: 'Pork-bone broth, rich and creamy', emoji: '🍜', avgCost: '¥900–1,500' },
  { name: 'Karaage', desc: 'Japanese fried chicken, juicy & crispy', emoji: '🍗', avgCost: '¥500–900' },
  { name: 'Takoyaki', desc: 'Octopus balls, best eaten hot', emoji: '🐙', avgCost: '¥400–700' },
  { name: 'Onigiri', desc: 'Rice balls — perfect convenience store snack', emoji: '🍙', avgCost: '¥120–200' },
];

const FOOD_AREAS = [
  { name: 'Shinjuku Golden Gai', type: 'Bar district', emoji: '🏮' },
  { name: 'Shibuya Food Hall', type: 'Department store basement', emoji: '🏬' },
  { name: 'Tsukiji Outer Market', type: 'Street food', emoji: '🐟' },
];

export function FoodDiningScreen(): React.ReactElement {
  const { theme } = useTheme();
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const isPro = false;

  const filteredRestaurants = MOCK_RESTAURANTS.filter((r) => {
    const matchesFilter = selectedFilter === 'All' || r.category === selectedFilter;
    const matchesSearch = !searchQuery || r.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.bg_primary }]}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: theme.space_md }]}>
          <Text style={[styles.headerTitle, { color: theme.text_primary, fontFamily: theme.font_display }]}>
            Food & Dining 🍜
          </Text>
          <Text style={[styles.headerSub, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
            Tokyo, Japan
          </Text>
        </View>

        {/* Search */}
        <View style={{ paddingHorizontal: theme.space_md, marginBottom: 12 }}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search restaurants…"
          />
        </View>

        {/* Filter bar */}
        <FilterBar
          options={FILTERS}
          selected={selectedFilter}
          onSelect={setSelectedFilter}
        />

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: theme.space_md }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Restaurant list */}
          {filteredRestaurants.map((r) => (
            <View key={r.id}>
              {r.isCelebPick && (
                <View style={styles.celebHeader}>
                  {!isPro && <PremiumBadge tier="voyager" />}
                  <Text style={[styles.celebLabel, { color: theme.brand_gold, fontFamily: theme.font_body }]}>
                    🌟 Celeb Pick: {r.celebName}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={[
                  styles.restaurantCard,
                  {
                    backgroundColor: theme.bg_surface,
                    borderColor: r.isCelebPick ? theme.brand_gold : theme.border_default,
                    borderWidth: r.isCelebPick ? 1.5 : 1,
                  },
                ]}
                activeOpacity={0.85}
              >
                {/* Photo placeholder */}
                <View style={[styles.restaurantPhoto, { backgroundColor: theme.bg_raised }]}>
                  <Text style={styles.restaurantEmoji}>{r.emoji}</Text>
                  {r.isCelebPick && !isPro && (
                    <View style={[styles.celebOverlay, { backgroundColor: `${theme.brand_gold}30` }]}>
                      <Text style={[styles.proLock, { color: theme.brand_gold }]}>🔒 Pro</Text>
                    </View>
                  )}
                </View>

                <View style={styles.restaurantInfo}>
                  <View style={styles.restaurantNameRow}>
                    <Text style={[styles.restaurantName, { color: theme.text_primary, fontFamily: theme.font_body_medium }]}>
                      {r.name}
                    </Text>
                    {r.openNow && <Badge label="Open" variant="success" size="sm" />}
                  </View>
                  <Text style={[styles.restaurantCat, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                    {r.category}
                    {' · '}
                    {'¥'.repeat(r.priceLevel)}
                  </Text>
                  <Text style={[styles.restaurantDesc, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                    {r.description}
                  </Text>
                  <View style={styles.restaurantMeta}>
                    <Text style={[styles.ratingText, { color: theme.brand_gold, fontFamily: theme.font_body }]}>
                      ⭐ {r.rating}
                    </Text>
                    <Text style={[styles.reviewText, { color: theme.text_disabled, fontFamily: theme.font_body }]}>
                      ({r.reviewCount.toLocaleString()})
                    </Text>
                    {r.estimatedWait && (
                      <Text style={[styles.waitText, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                        · Wait: {r.estimatedWait}
                      </Text>
                    )}
                  </View>
                  <View style={styles.tagsRow}>
                    {r.tags.map((tag) => (
                      <View key={tag} style={[styles.tag, { backgroundColor: theme.bg_raised }]}>
                        <Text style={[styles.tagText, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                          {tag}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          ))}

          {/* Local Dishes */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text_primary, fontFamily: theme.font_display }]}>
              Must-Try Local Dishes
            </Text>
            {LOCAL_DISHES.map((dish) => (
              <View
                key={dish.name}
                style={[styles.dishRow, { borderBottomColor: theme.border_default }]}
              >
                <Text style={styles.dishEmoji}>{dish.emoji}</Text>
                <View style={styles.dishInfo}>
                  <Text style={[styles.dishName, { color: theme.text_primary, fontFamily: theme.font_body_medium }]}>
                    {dish.name}
                  </Text>
                  <Text style={[styles.dishDesc, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                    {dish.desc}
                  </Text>
                </View>
                <Text style={[styles.dishCost, { color: theme.brand_gold, fontFamily: theme.font_body }]}>
                  {dish.avgCost}
                </Text>
              </View>
            ))}
          </View>

          {/* Best Food Areas */}
          <View style={[styles.section, { paddingBottom: 32 }]}>
            <Text style={[styles.sectionTitle, { color: theme.text_primary, fontFamily: theme.font_display }]}>
              Best Food Areas
            </Text>
            <View style={[styles.mapAreaPlaceholder, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}>
              <Text style={{ fontSize: 32 }}>🗺️</Text>
              <Text style={[{ color: theme.text_secondary, fontFamily: theme.font_body }]}>Food map</Text>
            </View>
            {FOOD_AREAS.map((area) => (
              <View
                key={area.name}
                style={[styles.areaRow, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}
              >
                <Text style={styles.areaEmoji}>{area.emoji}</Text>
                <View>
                  <Text style={[styles.areaName, { color: theme.text_primary, fontFamily: theme.font_body_medium }]}>
                    {area.name}
                  </Text>
                  <Text style={[styles.areaType, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                    {area.type}
                  </Text>
                </View>
              </View>
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
  header: { paddingTop: 8, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  headerSub: { fontSize: 13, marginTop: 2 },
  scrollContent: { gap: 12, paddingTop: 16 },
  celebHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  celebLabel: { fontSize: 13 },
  restaurantCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 4,
  },
  restaurantPhoto: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  restaurantEmoji: { fontSize: 48 },
  celebOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'flex-end',
    padding: 8,
  },
  proLock: { fontSize: 12, fontWeight: '700' },
  restaurantInfo: { padding: 12, gap: 6 },
  restaurantNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  restaurantName: { fontSize: 16, flex: 1 },
  restaurantCat: { fontSize: 13 },
  restaurantDesc: { fontSize: 13, lineHeight: 18 },
  restaurantMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13 },
  reviewText: { fontSize: 12 },
  waitText: { fontSize: 12 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 11 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  dishEmoji: { fontSize: 28, width: 40 },
  dishInfo: { flex: 1 },
  dishName: { fontSize: 14 },
  dishDesc: { fontSize: 12, marginTop: 2 },
  dishCost: { fontSize: 12 },
  mapAreaPlaceholder: {
    height: 120,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  areaEmoji: { fontSize: 24 },
  areaName: { fontSize: 14 },
  areaType: { fontSize: 12, marginTop: 2 },
});
