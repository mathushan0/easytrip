import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput as RNTextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@theme/useTheme';
import { ProgressBar } from '@components/atoms/ProgressBar';
import { TaskItem } from '@components/molecules/TaskItem';
import { Button } from '@components/atoms/Button';
import type { Task } from '@/types';

const MOCK_TASKS: Task[] = [
  {
    id: 'tk1', dayId: 'd1', tripId: 't1', position: 0,
    title: 'Check in at The Millennials Shinjuku',
    category: 'accommodation', startTime: '15:00', endTime: '15:30',
    durationMinutes: 30, isCompleted: true, completedAt: '2026-04-20T15:28:00Z',
    isCustom: false, description: 'Show QR code at lobby kiosk.',
    venueId: null, venue: null, travelTimeToNextMinutes: 20,
    transportMode: 'walk', estimatedCost: 0, actualCost: null,
    currency: 'JPY', tips: null, createdAt: '', updatedAt: '',
  },
  {
    id: 'tk2', dayId: 'd1', tripId: 't1', position: 1,
    title: 'Shinjuku Gyoen National Garden',
    category: 'landmark', startTime: '16:00', endTime: '18:00',
    durationMinutes: 120, isCompleted: false, completedAt: null,
    isCustom: false, description: 'Stunning cherry blossoms and traditional gardens.',
    venueId: null, venue: null, travelTimeToNextMinutes: 10,
    transportMode: 'walk', estimatedCost: 500, actualCost: null,
    currency: 'JPY', tips: 'Avoid weekends — very crowded.', createdAt: '', updatedAt: '',
  },
  {
    id: 'tk3', dayId: 'd1', tripId: 't1', position: 2,
    title: 'Golden Gai — bar hop',
    category: 'food', startTime: '19:00', endTime: '21:00',
    durationMinutes: 120, isCompleted: false, completedAt: null,
    isCustom: false, description: 'Tiny atmospheric bars, great local vibe.',
    venueId: null, venue: null, travelTimeToNextMinutes: null,
    transportMode: null, estimatedCost: 2000, actualCost: null,
    currency: 'JPY', tips: null, createdAt: '', updatedAt: '',
  },
  {
    id: 'tk4', dayId: 'd1', tripId: 't1', position: 3,
    title: 'Convenience store haul 🏪',
    category: 'general', startTime: '21:30', endTime: null,
    durationMinutes: 20, isCompleted: false, completedAt: null,
    isCustom: true, description: 'Grab breakfast for tomorrow from 7-Eleven.',
    venueId: null, venue: null, travelTimeToNextMinutes: null,
    transportMode: null, estimatedCost: 800, actualCost: null,
    currency: 'JPY', tips: null, createdAt: '', updatedAt: '',
  },
];

export function DailyPlannerScreen(): React.ReactElement {
  const { theme, resolvedCategoryColour } = useTheme();
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [activeTaskId, setActiveTaskId] = useState<string | null>('tk2');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');

  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const totalCount = tasks.length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, isCompleted: !t.isCompleted, completedAt: !t.isCompleted ? new Date().toISOString() : null }
          : t
      )
    );
  };

  const addCustomTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: `custom-${Date.now()}`,
      dayId: 'd1',
      tripId: 't1',
      position: tasks.length,
      title: newTaskTitle.trim(),
      category: 'general',
      startTime: newTaskTime || null,
      endTime: null,
      durationMinutes: null,
      isCompleted: false,
      completedAt: null,
      isCustom: true,
      description: null,
      venueId: null,
      venue: null,
      travelTimeToNextMinutes: null,
      transportMode: null,
      estimatedCost: null,
      actualCost: null,
      currency: 'JPY',
      tips: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks((prev) => [...prev, newTask]);
    setNewTaskTitle('');
    setNewTaskTime('');
    setShowAddModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg_primary }]}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: theme.space_md }]}>
          <View>
            <Text style={[styles.dayLabel, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
              Day 1 · Mon 20 Apr
            </Text>
            <Text style={[styles.dayTitle, { color: theme.text_primary, fontFamily: theme.font_display }]}>
              Arrival & Shinjuku
            </Text>
          </View>
          <View style={[styles.weatherBadge, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}>
            <Text>⛅</Text>
            <Text style={[{ color: theme.text_primary, fontFamily: theme.font_body, fontSize: 14 }]}>18°C</Text>
          </View>
        </View>

        {/* Progress */}
        <View style={[styles.progressSection, { paddingHorizontal: theme.space_md }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
              {completedCount} of {totalCount} completed
            </Text>
            <Text style={[styles.progressPct, { color: theme.brand_lime, fontFamily: theme.font_mono }]}>
              {progressPct.toFixed(0)}%
            </Text>
          </View>
          <ProgressBar
            value={progressPct}
            max={100}
            color={theme.brand_lime}
            trackColor={theme.bg_raised}
            height={6}
            borderRadius={3}
          />
        </View>

        <ScrollView
          contentContainerStyle={[styles.taskList, { paddingHorizontal: theme.space_md }]}
          showsVerticalScrollIndicator={false}
        >
          {tasks.map((task, idx) => {
            const isActive = task.id === activeTaskId;
            const catColor = resolvedCategoryColour(task.category as any);

            return (
              <TouchableOpacity
                key={task.id}
                onPress={() => setActiveTaskId(task.id === activeTaskId ? null : task.id)}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.taskCard,
                    {
                      backgroundColor: isActive ? `${catColor}15` : theme.bg_surface,
                      borderColor: isActive ? catColor : theme.border_default,
                    },
                  ]}
                >
                  {/* Colour bar */}
                  <View style={[styles.taskColorBar, { backgroundColor: catColor }]} />

                  <View style={styles.taskBody}>
                    <View style={styles.taskTopRow}>
                      {task.startTime && (
                        <Text style={[styles.taskTime, { color: theme.text_secondary, fontFamily: theme.font_mono }]}>
                          {task.startTime}
                        </Text>
                      )}
                      <TouchableOpacity
                        style={[
                          styles.checkBox,
                          {
                            backgroundColor: task.isCompleted ? theme.system_success : 'transparent',
                            borderColor: task.isCompleted ? theme.system_success : theme.border_default,
                          },
                        ]}
                        onPress={() => toggleTask(task.id)}
                      >
                        {task.isCompleted && <Text style={styles.checkMark}>✓</Text>}
                      </TouchableOpacity>
                    </View>

                    <Text
                      style={[
                        styles.taskTitle,
                        {
                          color: task.isCompleted ? theme.text_disabled : theme.text_primary,
                          fontFamily: isActive ? theme.font_body_medium : theme.font_body,
                          textDecorationLine: task.isCompleted ? 'line-through' : 'none',
                        },
                      ]}
                    >
                      {task.title}
                    </Text>

                    {isActive && task.description && (
                      <Text style={[styles.taskDesc, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                        {task.description}
                      </Text>
                    )}

                    {isActive && task.tips && (
                      <View style={[styles.tipBox, { backgroundColor: `${theme.brand_gold}20`, borderColor: theme.brand_gold }]}>
                        <Text style={[styles.tipText, { color: theme.brand_gold, fontFamily: theme.font_body }]}>
                          💡 {task.tips}
                        </Text>
                      </View>
                    )}

                    <View style={styles.taskMeta}>
                      {task.durationMinutes && (
                        <Text style={[styles.metaText, { color: theme.text_disabled, fontFamily: theme.font_body }]}>
                          ⏱ {task.durationMinutes}min
                        </Text>
                      )}
                      {task.estimatedCost && task.estimatedCost > 0 && (
                        <Text style={[styles.metaText, { color: theme.text_disabled, fontFamily: theme.font_body }]}>
                          💴 ¥{task.estimatedCost.toLocaleString()}
                        </Text>
                      )}
                      {task.isCustom && (
                        <Text style={[styles.metaText, { color: theme.brand_violet, fontFamily: theme.font_body }]}>
                          Custom
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* Travel connector */}
                {idx < tasks.length - 1 && task.travelTimeToNextMinutes && (
                  <View style={styles.travelConnector}>
                    <View style={[styles.travelLine, { backgroundColor: theme.border_default }]} />
                    <View style={[styles.travelBadge, { backgroundColor: theme.bg_raised }]}>
                      <Text style={[styles.travelText, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                        🚶 {task.travelTimeToNextMinutes} min
                      </Text>
                    </View>
                    <View style={[styles.travelLine, { backgroundColor: theme.border_default }]} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* FAB */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.brand_lime }]}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={[styles.fabText, { color: theme.bg_primary }]}>+ Task</Text>
        </TouchableOpacity>

        {/* Add Task Modal */}
        <Modal visible={showAddModal} transparent animationType="slide">
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <TouchableOpacity
              style={styles.modalBg}
              onPress={() => setShowAddModal(false)}
            />
            <View style={[styles.modalSheet, { backgroundColor: theme.bg_surface }]}>
              <Text style={[styles.modalTitle, { color: theme.text_primary, fontFamily: theme.font_display }]}>
                Add Custom Task
              </Text>
              <RNTextInput
                style={[
                  styles.modalInput,
                  {
                    color: theme.text_primary,
                    borderColor: theme.border_default,
                    backgroundColor: theme.bg_raised,
                    fontFamily: theme.font_body,
                  },
                ]}
                placeholder="Task title"
                placeholderTextColor={theme.text_disabled}
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
              />
              <RNTextInput
                style={[
                  styles.modalInput,
                  {
                    color: theme.text_primary,
                    borderColor: theme.border_default,
                    backgroundColor: theme.bg_raised,
                    fontFamily: theme.font_mono,
                  },
                ]}
                placeholder="Time (e.g. 14:30)"
                placeholderTextColor={theme.text_disabled}
                value={newTaskTime}
                onChangeText={setNewTaskTime}
              />
              <View style={styles.modalActions}>
                <Button label="Cancel" variant="ghost" onPress={() => setShowAddModal(false)} />
                <Button
                  label="Add Task"
                  variant="primary"
                  onPress={addCustomTask}
                  disabled={!newTaskTitle.trim()}
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
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
  dayLabel: { fontSize: 13 },
  dayTitle: { fontSize: 22, fontWeight: '700', marginTop: 2 },
  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  progressSection: { marginBottom: 16, gap: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 13 },
  progressPct: { fontSize: 13 },
  taskList: { gap: 0, paddingTop: 8 },
  taskCard: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 2,
  },
  taskColorBar: { width: 4 },
  taskBody: { flex: 1, padding: 12, gap: 6 },
  taskTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskTime: { fontSize: 12 },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { fontSize: 13, color: '#fff', fontWeight: '700' },
  taskTitle: { fontSize: 15, lineHeight: 20 },
  taskDesc: { fontSize: 13, lineHeight: 18 },
  tipBox: { borderRadius: 8, borderWidth: 1, padding: 8 },
  tipText: { fontSize: 12, lineHeight: 17 },
  taskMeta: { flexDirection: 'row', gap: 12 },
  metaText: { fontSize: 11 },
  travelConnector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    paddingHorizontal: 24,
  },
  travelLine: { flex: 1, height: 1 },
  travelBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  travelText: { fontSize: 11 },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    borderRadius: 24,
    paddingHorizontal: 20,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: { fontSize: 15, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBg: { flex: 1 },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  modalActions: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
});
