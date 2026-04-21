import React, { useRef } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { format, parseISO } from 'date-fns';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@theme/useTheme';
import type { ItineraryDay } from '@/types';

export interface DayTabStripProps {
  days: ItineraryDay[];
  activeIndex: number;
  onSelect: (index: number) => void;
  style?: ViewStyle;
}

export function DayTabStrip({
  days,
  activeIndex,
  onSelect,
  style,
}: DayTabStripProps): React.ReactElement {
  const { theme } = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  const handlePress = (index: number) => {
    onSelect(index);
    // Scroll to keep active item in view
    scrollRef.current?.scrollTo({ x: index * 64 - 32, animated: true });
  };

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={style}
    >
      {days.map((day, i) => {
        const isActive = i === activeIndex;
        const date = parseISO(day.date);

        return (
          <TouchableOpacity
            key={day.id}
            onPress={() => handlePress(i)}
            style={[
              styles.tab,
              {
                backgroundColor: isActive
                  ? theme.interactive_primary
                  : theme.bg_surface,
                borderColor: isActive
                  ? theme.interactive_primary
                  : theme.border_default,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Day ${day.dayNumber}, ${format(date, 'EEEE MMMM d')}`}
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                styles.dayNum,
                {
                  fontFamily: theme.font_display,
                  color: isActive ? theme.text_inverse : theme.text_primary,
                  fontSize: 18,
                },
              ]}
            >
              {day.dayNumber}
            </Text>
            <Text
              style={[
                styles.dayDate,
                {
                  fontFamily: theme.font_mono,
                  color: isActive ? theme.text_inverse : theme.text_secondary,
                  fontSize: 10,
                },
              ]}
            >
              {format(date, 'dd')}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  tab: {
    width: 52,
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayNum: {
    fontWeight: '800',
    lineHeight: 22,
  },
  dayDate: {
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    lineHeight: 13,
  },
});
