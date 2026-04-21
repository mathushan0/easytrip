import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import {
  CheckCircle2,
  Circle,
  GripVertical,
  ChevronRight,
  Clock,
  Navigation,
} from 'lucide-react-native';
import { useTheme, useCategoryColour } from '@theme/useTheme';
import type { Task, TaskCategory } from '@/types';

export interface TaskItemProps {
  task: Task;
  onComplete?: (taskId: string) => void;
  onUncomplete?: (taskId: string) => void;
  onPress?: (task: Task) => void;
  onLongPress?: (task: Task) => void;
  isDragging?: boolean;
  showDragHandle?: boolean;
  isNow?: boolean;
  style?: ViewStyle;
}

const CATEGORY_ICONS: Record<TaskCategory, string> = {
  food:          '🍜',
  landmark:      '🏛',
  transport:     '🚆',
  culture:       '🎨',
  budget:        '💰',
  accommodation: '🏨',
  general:       '📌',
};

export function TaskItem({
  task,
  onComplete,
  onUncomplete,
  onPress,
  onLongPress,
  isDragging = false,
  showDragHandle = false,
  isNow = false,
  style,
}: TaskItemProps): React.ReactElement {
  const { theme } = useTheme();
  const categoryColour = useCategoryColour(task.category as never);

  const checkScale = useSharedValue(1);
  const cardOpacity = useSharedValue(task.isCompleted ? 0.55 : 1);

  const checkAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const cardAnimStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    ...(isDragging && {
      shadowOpacity: 0.4,
      elevation: 12,
    }),
  }));

  const handleCheckPress = useCallback(() => {
    // Animate checkbox
    checkScale.value = withSpring(1.3, { damping: 10 }, () => {
      checkScale.value = withSpring(1, { damping: 12 });
    });

    if (task.isCompleted) {
      cardOpacity.value = withTiming(1, { duration: 200 });
      onUncomplete?.(task.id);
    } else {
      cardOpacity.value = withTiming(0.55, { duration: 200 });
      onComplete?.(task.id);
    }
  }, [task.isCompleted, task.id, checkScale, cardOpacity, onComplete, onUncomplete]);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: theme.bg_surface,
          borderColor: isNow ? theme.brand_cyan : theme.border_default,
          borderWidth: isNow ? 1 : StyleSheet.hairlineWidth,
          borderRadius: theme.radius_md,
        },
        isDragging && styles.dragging,
        cardAnimStyle,
        style,
      ]}
    >
      {/* Left: checkbox */}
      <Animated.View style={checkAnimStyle}>
        <TouchableOpacity
          onPress={handleCheckPress}
          style={styles.checkbox}
          accessibilityRole="checkbox"
          accessibilityLabel={`Mark "${task.title}" as ${task.isCompleted ? 'incomplete' : 'complete'}`}
          accessibilityState={{ checked: task.isCompleted }}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          {task.isCompleted ? (
            <CheckCircle2
              size={22}
              color={theme.system_success}
              fill={`${theme.system_success}33`}
            />
          ) : (
            <Circle size={22} color={theme.text_disabled} />
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Category dot */}
      <View
        style={[styles.categoryDot, { backgroundColor: categoryColour }]}
        accessibilityElementsHidden
      />

      {/* Main content */}
      <TouchableOpacity
        style={styles.content}
        onPress={() => onPress?.(task)}
        onLongPress={() => onLongPress?.(task)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${task.title}. ${task.startTime ? `Time: ${task.startTime}.` : ''} ${task.category} task.`}
      >
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.time,
              { fontFamily: theme.font_mono, color: theme.text_secondary },
            ]}
          >
            {task.startTime ?? ''}
          </Text>
          {isNow ? (
            <View style={[styles.nowBadge, { backgroundColor: theme.brand_cyan }]}>
              <Text
                style={[styles.nowLabel, { fontFamily: theme.font_mono, color: theme.text_inverse }]}
              >
                NOW
              </Text>
            </View>
          ) : null}
        </View>

        <Text
          style={[
            styles.title,
            {
              fontFamily: theme.font_display,
              color: theme.text_primary,
              textDecorationLine: task.isCompleted ? 'line-through' : 'none',
              opacity: task.isCompleted ? 0.6 : 1,
            },
          ]}
          numberOfLines={2}
        >
          {task.title}
        </Text>

        {task.description ? (
          <Text
            style={[
              styles.description,
              { fontFamily: theme.font_body, color: theme.text_secondary },
            ]}
            numberOfLines={1}
          >
            {task.description}
          </Text>
        ) : null}

        {/* Cost + travel time row */}
        <View style={styles.metaRow}>
          {task.estimatedCost != null ? (
            <Text
              style={[
                styles.meta,
                { fontFamily: theme.font_body, color: theme.text_secondary },
              ]}
            >
              ~{task.currency ?? '£'}{task.estimatedCost.toFixed(0)}
            </Text>
          ) : null}
          {task.travelTimeToNextMinutes != null ? (
            <View style={styles.travelRow}>
              <Navigation size={10} color={theme.text_disabled} />
              <Text
                style={[
                  styles.meta,
                  { fontFamily: theme.font_mono, color: theme.text_disabled },
                ]}
              >
                {task.travelTimeToNextMinutes} min
              </Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>

      {/* Right: drag handle OR chevron */}
      {showDragHandle ? (
        <View
          style={styles.dragHandle}
          accessibilityRole="none"
          accessibilityLabel="Drag to reorder"
          accessibilityHint="Long press and drag to reorder tasks"
        >
          <GripVertical size={18} color={theme.text_disabled} />
        </View>
      ) : (
        <ChevronRight size={16} color={theme.text_disabled} style={styles.chevron} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dragging: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
    transform: [{ scale: 1.03 }],
  },
  checkbox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4,
    marginLeft: -4,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  time: {
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  nowBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  nowLabel: {
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: '700',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  meta: {
    fontSize: 12,
  },
  travelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dragHandle: {
    width: 28,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    alignSelf: 'center',
    marginLeft: 4,
  },
});
