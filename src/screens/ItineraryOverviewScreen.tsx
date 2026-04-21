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
import { DayTabStrip } from '@components/molecules/DayTabStrip';
import { VenueCard } from '@components/molecules/VenueCard';
import { Badge } from '@components/atoms/Badge';
import { Button } from '@components/atoms/Button';
import type { ItineraryDay, Task } from '@/types';

const MOCK_DAYS: ItineraryDay[] = [
  {
    id: 'd1', tripId: 't1', dayNumber: 1, date: '2026-04-20',
    title: 'Arrival & Shinjuku', summary: 'Land, check in, explore Shinjuku.',
    weatherSnapshot: { temp: 18, condition: 'Partly cloudy', icon: '⛅' },
    tasks: [
      {
        id: 'tk1', dayId: 'd1', tripId: 't1', position: 0,
        title: 'Check in at The Millennials Shinjuku', category: 'accommodation',
        startTime: '15:00', endTime: '15:30', durationMinutes: 30,
        isCompleted: true, completedAt: null, isCustom: false,
        description: 'Show QR code at lobby kiosk.',
        venueId: null, venue: null, travelTimeToNextMinutes: 20,
        transportMode: 'walk', estimatedCost: 0, actualCost: null,
        currency: 'JPY', tips: null, createdAt: '', updatedAt: '',
        endTime: '15:30',
      } as Task,
      {
        id: 'tk2', dayId: 'd1', tripId: 't1', position: 1,
        title: 'Shinjuku Gyoen National Garden', category: 'landmark',
        startTime: '16:00', endTime: '18:00', durationMinutes: 120,
        isCompleted: false, completedAt: null, isCustom: false,
        description: 'Stunning cherry blossoms and traditional gardens.',
        venueId: null, venue: null, travelTimeToNextMinutes: 10,
        transportMode: 'walk', estimatedCost: 500, actualCost: null,
        currency: 'JPY', tips: 'Avoid weekends — very crowded.', createdAt: '', updatedAt: '',
      } as Task,
      {
        id: 'tk3', dayId: 'd1', tripId: 't1', position: 2,
        title: 'Ramen at Ichiran Shinjuku', category: 'food',
        startTime: '19:30', endTime: '20:30', durationMinutes: 60,
        isCompleted: false, completedAt: null, isCustom: false,
        description: 'Solo booth ramen experience.',
        venueId: null, venue: null, travelTimeToNextMinutes: null,
        transportMode: null, estimatedCost: 1200, actualCost: null,
        currency: 'JPY', tips: null, createdAt: '', updatedAt: '',
      } as Task,
    ],
    createdAt: '', updatedAt: '',
  },
  {
    id: 'd2', tripId: 't1', dayNumber: 2, date: '2026-04-21',
    title: 'Asakusa & Akihabara', summary: 'Old Tokyo meets neon gaming.',
    weatherSnapshot: { temp: 20, condition: 'Sunny', icon: '☀️' },
    tasks: [],
    createdAt: '', updatedAt: '',
  },
  {
    id: 'd3', tripId: 't1', dayNumber: 3, date: '2026-04-22',
    title: 'Harajuku & Shibuya', summary: 'Fashion, crossing, takoyaki.',
    weatherSnapshot: null,
    tasks: [],
    createdAt: '', updatedAt: '',
  },
];

const CATEGORY_ICONS: Record<string, string> = {
  food: '🍜',
  landmark: '🏛️',
  transport: '🚆',
  culture: '🎭',
  budget: '💰',
  accommodation: '🏨',
  general: '📍',
};

export function ItineraryOverviewScreen(): React.ReactElement {
  const { theme, resolvedCategoryColour } = useTheme();
  const [selectedDay, setSelectedDay] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const day = MOCK_DAYS[selectedDay];
  const totalCost = MOCK_DAYS.flatMap((d) => d.tasks)
    .reduce((sum, t) => sum + (t.estimatedCost ?? 0), 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg_primary }]}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: theme.space_md }]}>
          <View>
            <Text style={[styles.tripName, { color: theme.text_primary, fontFamily: theme.font_display }]}>
              Tokyo, Japan
            </Text>
            <Text style={[styles.tripDates, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
              Apr 20 – Apr 28 · 9 days
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}
            >
              <Text>📤</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}
            >
              <Text>🔗</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cost Summary */}
        <View style={[styles.costBanner, { backgroundColor: theme.bg_surface, marginHorizontal: theme.space_md, borderColor: theme.border_default }]}>
          <View style={styles.costItem}>
            <Text style={[styles.costLabel, { color: theme.text_secondary, fontFamily: theme.font_body }]}>Est. total</Text>
            <Text style={[styles.costValue, { color: theme.text_primary, fontFamily: theme.font_display }]}>
              ¥{totalCost.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.costDivider, { backgroundColor: theme.border_default }]} />
          <View style={styles.costItem}>
            <Text style={[styles.costLabel, { color: theme.text_secondary, fontFamily: theme.font_body }]}>Activities</Text>
            <Text style={[styles.costValue, { color: theme.text_primary, fontFamily: theme.font_display }]}>
              {MOCK_DAYS.flatMap((d) => d.tasks).length} stops
            </Text>
          </View>
          <View style={[styles.costDivider, { backgroundColor: theme.border_default }]} />
          <View style={styles.costItem}>
            <Text style={[styles.costLabel, { color: theme.text_secondary, fontFamily: theme.font_body }]}>Completed</Text>
            <Text style={[styles.costValue, { color: theme.system_success, fontFamily: theme.font_display }]}>
              {MOCK_DAYS.flatMap((d) => d.tasks).filter((t) => t.isCompleted).length}
            </Text>
          </View>
        </View>

        {/* Day Tab Strip */}
        <DayTabStrip
          days={MOCK_DAYS.map((d) => ({ id: d.id, dayNumber: d.dayNumber, date: d.date, label: d.title ?? `Day ${d.dayNumber}` }))}
          selectedIndex={selectedDay}
          onSelect={setSelectedDay}
        />

        {/* View toggle */}
        <View style={[styles.toggleRow, { paddingHorizontal: theme.space_md }]}>
          <View style={[styles.viewToggle, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}>
            {(['list', 'map'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.viewToggleBtn,
                  viewMode === mode && { backgroundColor: theme.interactive_primary },
                ]}
                onPress={() => setViewMode(mode)}
              >
                <Text style={[styles.viewToggleText, { color: viewMode === mode ? theme.text_inverse : theme.text_secondary, fontFamily: theme.font_body }]}>
                  {mode === 'list' ? '📋 List' : '🗺️ Map'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {day.weatherSnapshot && (
            <View style={[styles.weatherChip, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}>
              <Text>{day.weatherSnapshot.icon}</Text>
              <Text style={[{ color: theme.text_primary, fontFamily: theme.font_body, fontSize: 13 }]}>
                {day.weatherSnapshot.temp}°C
              </Text>
            </View>
          )}
        </View>

        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingHorizontal: theme.space_md }]} showsVerticalScrollIndicator={false}>
          {viewMode === 'map' ? (
            <View style={[styles.mapPlaceholder, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}>
              <Text style={{ fontSize: 40 }}>🗺️</Text>
              <Text style={[{ color: theme.text_secondary, fontFamily: theme.font_body, marginTop: 8 }]}>
                Map view coming soon
              </Text>
            </View>
          ) : (
            <View style={styles.taskList}>
              {day.title && (
                <Text style={[styles.dayTitle, { color: theme.text_primary, fontFamily: theme.font_display }]}>
                  Day {day.dayNumber}: {day.title}
                </Text>
              )}
              {day.summary && (
                <Text style={[styles.daySummary, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                  {day.summary}
                </Text>
              )}
              {day.tasks.length === 0 ? (
                <View style={[styles.emptyDay, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}>
                  <Text style={{ fontSize: 32 }}>📭</Text>
                  <Text style={[{ color: theme.text_secondary, fontFamily: theme.font_body, marginTop: 8 }]}>
                    No tasks planned yet
                  </Text>
                  <Button label="Open Daily Planner" variant="outline" size="sm" style={{ marginTop: 12 }} />
                </View>
              ) : (
                day.tasks.map((task, idx) => (
                  <View key={task.id} style={styles.taskRow}>
                    {/* Timeline line */}
                    <View style={styles.timeline}>
                      <View style={[styles.timelineDot, { backgroundColor: resolvedCategoryColour(task.category as any) }]} />
                      {idx < day.tasks.length - 1 && (
                        <View style={[styles.timelineLine, { backgroundColor: theme.border_default }]} />
                      )}
                    </View>
                    {/* Task card */}
                    <View style={[styles.taskCard, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}>
                      <View style={styles.taskHeader}>
                        <View style={styles.taskTitleRow}>
                          <Text style={styles.taskCategoryIcon}>
                            {CATEGORY_ICONS[task.category] ?? '📍'}
                          </Text>
                          <Text style={[styles.taskTitle, { color: task.isCompleted ? theme.text_disabled : theme.text_primary, fontFamily: theme.font_body_medium, textDecorationLine: task.isCompleted ? 'line-through' : 'none' }]}>
                            {task.title}
                          </Text>
                        </View>
                        {task.isCompleted && <Badge label="Done" variant="success" size="sm" />}
                      </View>
                      {task.startTime && (
                        <Text style={[styles.taskTime, { color: theme.text_secondary, fontFamily: theme.font_mono }]}>
                          {task.startTime}{task.endTime ? ` – ${task.endTime}` : ''}
                          {task.durationMinutes ? ` · ${task.durationMinutes}min` : ''}
                        </Text>
                      )}
                      {task.description && (
                        <Text style={[styles.taskDesc, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                          {task.description}
                        </Text>
                      )}
                      {task.estimatedCost && (
                        <Text style={[styles.taskCost, { color: theme.brand_gold, fontFamily: theme.font_body }]}>
                          ~{task.currency} {task.estimatedCost.toLocaleString()}
                        </Text>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
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
  tripName: { fontSize: 22, fontWeight: '700' },
  tripDates: { fontSize: 13, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  costBanner: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  costItem: { flex: 1, alignItems: 'center' },
  costLabel: { fontSize: 11, marginBottom: 4 },
  costValue: { fontSize: 15, fontWeight: '700' },
  costDivider: { width: 1, marginHorizontal: 8 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    flex: 1,
  },
  viewToggleBtn: { flex: 1, height: 36, alignItems: 'center', justifyContent: 'center' },
  viewToggleText: { fontSize: 13 },
  weatherChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 36,
  },
  scrollContent: { paddingBottom: 32 },
  mapPlaceholder: {
    height: 300,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskList: { gap: 0 },
  dayTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  daySummary: { fontSize: 14, marginBottom: 16, lineHeight: 20 },
  emptyDay: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
  },
  taskRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  timeline: { width: 20, alignItems: 'center' },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 14 },
  timelineLine: { width: 2, flex: 1, marginTop: 4 },
  taskCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, gap: 6 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  taskTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  taskCategoryIcon: { fontSize: 16 },
  taskTitle: { fontSize: 14, flex: 1 },
  taskTime: { fontSize: 12 },
  taskDesc: { fontSize: 13, lineHeight: 18 },
  taskCost: { fontSize: 12 },
});
