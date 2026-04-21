import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme/useTheme';
import type { PeakHoursData } from '@/types';

const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
const DAY_MAP: Record<number, DayKey> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

const HOUR_LABELS = ['12a', '3a', '6a', '9a', '12p', '3p', '6p', '9p'];

interface PeakHoursChartProps {
  data: PeakHoursData;
  highlightCurrentHour?: boolean;
}

export function PeakHoursChart({
  data,
  highlightCurrentHour = true,
}: PeakHoursChartProps): React.ReactElement {
  const { theme } = useTheme();

  const now = new Date();
  const todayKey = DAY_MAP[now.getDay()];
  const currentHour = now.getHours();

  const todayData: number[] = data[todayKey] ?? new Array(24).fill(0);

  const maxVal = useMemo(() => Math.max(...todayData, 1), [todayData]);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
        Popular times · Today
      </Text>

      {/* Bar chart */}
      <View style={styles.chartArea}>
        {todayData.map((val, hour) => {
          const heightPct = (val / maxVal) * 100;
          const isNow = highlightCurrentHour && hour === currentHour;
          const isBusy = val >= 75;
          const barColor = isNow
            ? theme.brand_lime
            : isBusy
            ? theme.brand_coral
            : theme.interactive_primary;

          return (
            <View key={hour} style={styles.barWrapper}>
              <View style={[styles.barTrack, { backgroundColor: theme.bg_raised }]}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${heightPct}%`,
                      backgroundColor: barColor,
                      opacity: isNow ? 1 : 0.7,
                    },
                  ]}
                />
              </View>
              {isNow && (
                <View
                  style={[styles.nowDot, { backgroundColor: theme.brand_lime }]}
                />
              )}
            </View>
          );
        })}
      </View>

      {/* Hour labels */}
      <View style={styles.labelsRow}>
        {HOUR_LABELS.map((label, i) => (
          <Text
            key={label}
            style={[
              styles.hourLabel,
              {
                color: theme.text_disabled,
                fontFamily: theme.font_mono,
                left: `${(i / (HOUR_LABELS.length - 1)) * 100}%`,
              },
            ]}
          >
            {label}
          </Text>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.brand_lime }]} />
          <Text style={[styles.legendText, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
            Now
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.brand_coral }]} />
          <Text style={[styles.legendText, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
            Very busy
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.interactive_primary }]} />
          <Text style={[styles.legendText, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
            Moderate
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  title: {
    fontSize: 13,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 60,
    gap: 2,
    paddingHorizontal: 4,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  barTrack: {
    width: '80%',
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 3,
    minHeight: 2,
  },
  nowDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  labelsRow: {
    height: 20,
    marginTop: 6,
    position: 'relative',
  },
  hourLabel: {
    position: 'absolute',
    fontSize: 10,
    transform: [{ translateX: -12 }],
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
  },
});
