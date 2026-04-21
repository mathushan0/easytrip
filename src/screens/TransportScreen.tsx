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
import { Button } from '@components/atoms/Button';
import type { RouteOption, TransportMode } from '@/types';

const { width } = Dimensions.get('window');

const MOCK_ROUTES: RouteOption[] = [
  {
    mode: 'metro',
    durationMinutes: 8,
    distanceMetres: 1800,
    estimatedCost: 170,
    currency: 'JPY',
    departureTime: '14:30',
    isRecommended: true,
    steps: [
      { instruction: 'Walk to Shinjuku Station', mode: 'walk', durationMinutes: 4, distanceMetres: 300 },
      { instruction: 'Take Marunouchi Line (M10 → M08)', mode: 'metro', durationMinutes: 3, distanceMetres: 1400, lineCode: 'M', departureStop: 'Shinjuku-Sanchome', arrivalStop: 'Shinjuku-Gyoenmae' },
      { instruction: 'Walk to garden entrance', mode: 'walk', durationMinutes: 1, distanceMetres: 100 },
    ],
    polyline: [],
  },
  {
    mode: 'walk',
    durationMinutes: 22,
    distanceMetres: 1600,
    estimatedCost: 0,
    currency: 'JPY',
    departureTime: null,
    isRecommended: false,
    steps: [
      { instruction: 'Head south on Shinjuku-dori', mode: 'walk', durationMinutes: 10, distanceMetres: 800 },
      { instruction: 'Turn left at Takashimaya Times Sq', mode: 'walk', durationMinutes: 7, distanceMetres: 500 },
      { instruction: 'Arrive at Shinjuku Gyoen main gate', mode: 'walk', durationMinutes: 5, distanceMetres: 300 },
    ],
    polyline: [],
  },
  {
    mode: 'taxi',
    durationMinutes: 6,
    distanceMetres: 1800,
    estimatedCost: 750,
    currency: 'JPY',
    departureTime: null,
    isRecommended: false,
    steps: [
      { instruction: 'Hail a cab on Shinjuku Dori', mode: 'taxi', durationMinutes: 6, distanceMetres: 1800 },
    ],
    polyline: [],
  },
  {
    mode: 'bike',
    durationMinutes: 14,
    distanceMetres: 1600,
    estimatedCost: 165,
    currency: 'JPY',
    departureTime: null,
    isRecommended: false,
    steps: [
      { instruction: 'Pick up DOCOMO bike near hotel', mode: 'bike', durationMinutes: 3, distanceMetres: 200 },
      { instruction: 'Cycle along Shinjuku-dori', mode: 'bike', durationMinutes: 11, distanceMetres: 1400 },
    ],
    polyline: [],
  },
];

const MODE_META: Record<TransportMode, { emoji: string; label: string; color: string }> = {
  metro: { emoji: '🚇', label: 'Metro', color: '#EF4444' },
  walk: { emoji: '🚶', label: 'Walk', color: '#22C55E' },
  taxi: { emoji: '🚕', label: 'Taxi', color: '#EAB308' },
  bike: { emoji: '🚲', label: 'Bike', color: '#3B82F6' },
  bus: { emoji: '🚌', label: 'Bus', color: '#8B5CF6' },
};

const MOCK_PASS = {
  passName: 'Tokyo Metro 24h Pass',
  description: 'Unlimited rides on all Tokyo Metro lines',
  costAmount: 600,
  costCurrency: 'JPY',
  coverage: 'All 9 Tokyo Metro lines',
  validityPeriod: '24 hours from first use',
  purchaseLocations: 'Any Metro station ticket machine or Suica app',
};

export function TransportScreen(): React.ReactElement {
  const { theme } = useTheme();
  const [selectedMode, setSelectedMode] = useState<TransportMode>('metro');
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const selectedRoute = MOCK_ROUTES.find((r) => r.mode === selectedMode) ?? MOCK_ROUTES[0];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg_primary }]}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: theme.space_md }]}>
          <Text style={[styles.headerTitle, { color: theme.text_primary, fontFamily: theme.font_display }]}>
            Transport
          </Text>
        </View>

        {/* From / To */}
        <View style={[styles.fromToCard, { backgroundColor: theme.bg_surface, borderColor: theme.border_default, marginHorizontal: theme.space_md }]}>
          <View style={styles.fromToRow}>
            <View style={[styles.fromToDot, { backgroundColor: theme.brand_lime }]} />
            <View style={styles.fromToInfo}>
              <Text style={[styles.fromToLabel, { color: theme.text_secondary, fontFamily: theme.font_body }]}>From</Text>
              <Text style={[styles.fromToValue, { color: theme.text_primary, fontFamily: theme.font_body_medium }]}>
                The Millennials Shinjuku
              </Text>
            </View>
          </View>
          <View style={[styles.fromToConnector, { backgroundColor: theme.border_default }]} />
          <View style={styles.fromToRow}>
            <View style={[styles.fromToDot, { backgroundColor: theme.brand_coral }]} />
            <View style={styles.fromToInfo}>
              <Text style={[styles.fromToLabel, { color: theme.text_secondary, fontFamily: theme.font_body }]}>To</Text>
              <Text style={[styles.fromToValue, { color: theme.text_primary, fontFamily: theme.font_body_medium }]}>
                Shinjuku Gyoen National Garden
              </Text>
            </View>
          </View>
        </View>

        {/* Map placeholder */}
        <View style={[styles.mapPlaceholder, { backgroundColor: theme.bg_surface, marginHorizontal: theme.space_md, borderColor: theme.border_default }]}>
          <Text style={{ fontSize: 32 }}>🗺️</Text>
          <Text style={[{ color: theme.text_secondary, fontFamily: theme.font_body }]}>Route map</Text>
          <View
            style={[
              styles.mapRouteLine,
              { backgroundColor: MODE_META[selectedMode]?.color ?? theme.brand_lime },
            ]}
          />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: theme.space_md }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Mode tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modeTabs}>
            {MOCK_ROUTES.map((route) => {
              const meta = MODE_META[route.mode];
              const isSelected = selectedMode === route.mode;
              return (
                <TouchableOpacity
                  key={route.mode}
                  style={[
                    styles.modeTab,
                    {
                      backgroundColor: isSelected ? `${meta.color}20` : theme.bg_surface,
                      borderColor: isSelected ? meta.color : theme.border_default,
                    },
                  ]}
                  onPress={() => setSelectedMode(route.mode)}
                >
                  {route.isRecommended && (
                    <View style={[styles.recommendedBadge, { backgroundColor: theme.brand_lime }]}>
                      <Text style={[styles.recommendedText, { color: theme.bg_primary }]}>Best</Text>
                    </View>
                  )}
                  <Text style={styles.modeEmoji}>{meta.emoji}</Text>
                  <Text style={[styles.modeLabel, { color: isSelected ? meta.color : theme.text_primary, fontFamily: theme.font_body_medium }]}>
                    {meta.label}
                  </Text>
                  <Text style={[styles.modeDuration, { color: theme.text_secondary, fontFamily: theme.font_mono }]}>
                    {route.durationMinutes}m
                  </Text>
                  <Text style={[styles.modeCost, { color: theme.brand_gold, fontFamily: theme.font_body }]}>
                    {route.estimatedCost === 0 ? 'Free' : `¥${route.estimatedCost}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Selected route detail */}
          <View style={[styles.routeDetail, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}>
            <View style={styles.routeDetailHeader}>
              <Text style={[styles.routeDetailTitle, { color: theme.text_primary, fontFamily: theme.font_display }]}>
                {MODE_META[selectedMode]?.emoji} {MODE_META[selectedMode]?.label} Route
              </Text>
              <View style={styles.routeDetailMeta}>
                <Text style={[styles.routeMetaText, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                  ⏱ {selectedRoute.durationMinutes} min
                </Text>
                <Text style={[styles.routeMetaText, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                  📏 {(selectedRoute.distanceMetres / 1000).toFixed(1)} km
                </Text>
              </View>
            </View>

            {/* Steps */}
            {selectedRoute.steps.map((step, idx) => (
              <View key={idx} style={styles.stepRow}>
                <View style={styles.stepTimeline}>
                  <View style={[styles.stepDot, { backgroundColor: MODE_META[step.mode]?.color ?? theme.interactive_primary }]} />
                  {idx < selectedRoute.steps.length - 1 && (
                    <View style={[styles.stepLine, { backgroundColor: theme.border_default }]} />
                  )}
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepInstruction, { color: theme.text_primary, fontFamily: theme.font_body }]}>
                    {step.instruction}
                  </Text>
                  <Text style={[styles.stepMeta, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                    {MODE_META[step.mode]?.emoji} {step.durationMinutes} min
                    {step.lineCode ? ` · Line ${step.lineCode}` : ''}
                  </Text>
                </View>
              </View>
            ))}

            {selectedRoute.departureTime && (
              <View style={[styles.departureRow, { backgroundColor: theme.bg_raised }]}>
                <Text style={[styles.departureText, { color: theme.text_primary, fontFamily: theme.font_body_medium }]}>
                  Next departure: {selectedRoute.departureTime}
                </Text>
              </View>
            )}
          </View>

          {/* Travel pass recommendation */}
          <View style={[styles.passCard, { backgroundColor: `${theme.brand_cyan}10`, borderColor: theme.brand_cyan }]}>
            <View style={styles.passHeader}>
              <Text style={styles.passIcon}>🎫</Text>
              <View style={styles.passInfo}>
                <Text style={[styles.passName, { color: theme.text_primary, fontFamily: theme.font_body_medium }]}>
                  {MOCK_PASS.passName}
                </Text>
                <Text style={[styles.passCoverage, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                  {MOCK_PASS.coverage}
                </Text>
              </View>
              <Text style={[styles.passCost, { color: theme.brand_cyan, fontFamily: theme.font_display }]}>
                ¥{MOCK_PASS.costAmount}
              </Text>
            </View>
            <Text style={[styles.passValidity, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
              Valid: {MOCK_PASS.validityPeriod}
            </Text>
            <Text style={[styles.passWhere, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
              📍 {MOCK_PASS.purchaseLocations}
            </Text>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: { paddingTop: 8, paddingBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  fromToCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  fromToRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  fromToDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  fromToConnector: { width: 2, height: 16, marginLeft: 5, marginVertical: 2 },
  fromToInfo: {},
  fromToLabel: { fontSize: 11, marginBottom: 2 },
  fromToValue: { fontSize: 14 },
  mapPlaceholder: {
    height: 160,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 4,
    overflow: 'hidden',
  },
  mapRouteLine: {
    position: 'absolute',
    height: 3,
    width: '60%',
    borderRadius: 2,
    top: '50%',
    left: '20%',
    opacity: 0.5,
  },
  scrollContent: { gap: 16 },
  modeTabs: { gap: 10, paddingBottom: 4 },
  modeTab: {
    width: 90,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    position: 'relative',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    right: -4,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  recommendedText: { fontSize: 9, fontWeight: '700' },
  modeEmoji: { fontSize: 24 },
  modeLabel: { fontSize: 12 },
  modeDuration: { fontSize: 12 },
  modeCost: { fontSize: 11 },
  routeDetail: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  routeDetailHeader: { gap: 6 },
  routeDetailTitle: { fontSize: 16, fontWeight: '700' },
  routeDetailMeta: { flexDirection: 'row', gap: 16 },
  routeMetaText: { fontSize: 13 },
  stepRow: { flexDirection: 'row', gap: 12 },
  stepTimeline: { width: 20, alignItems: 'center', gap: 0 },
  stepDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  stepLine: { width: 2, flex: 1, marginTop: 2 },
  stepContent: { flex: 1, paddingBottom: 8 },
  stepInstruction: { fontSize: 14, lineHeight: 20 },
  stepMeta: { fontSize: 12, marginTop: 2 },
  departureRow: { borderRadius: 10, padding: 10, alignItems: 'center' },
  departureText: { fontSize: 14 },
  passCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  passHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  passIcon: { fontSize: 28 },
  passInfo: { flex: 1 },
  passName: { fontSize: 14, lineHeight: 20 },
  passCoverage: { fontSize: 12, marginTop: 2 },
  passCost: { fontSize: 18, fontWeight: '700' },
  passValidity: { fontSize: 12 },
  passWhere: { fontSize: 12 },
});
