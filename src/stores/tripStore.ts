import { create } from 'zustand';
import type { Trip, ItineraryDay, Task } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// TRIP STORE — in-memory state for active trip data
// Server state/caching handled by TanStack Query
// ─────────────────────────────────────────────────────────────────────────────

interface TripState {
  // Active trip selection
  activeTripId: string | null;
  activeTrip: Trip | null;
  activeDays: ItineraryDay[];
  activeDayIndex: number;

  // Trip list cache (supplemental — TanStack Query is primary)
  trips: Trip[];

  // Generation state
  generationJobId: string | null;
  generationProgress: number;
  generationStep: string | null;
  isGenerating: boolean;

  // Actions
  setActiveTrip: (trip: Trip, days: ItineraryDay[]) => void;
  setActiveDayIndex: (index: number) => void;
  updateTask: (task: Task) => void;
  reorderTasks: (dayId: string, orderedTaskIds: string[]) => void;
  completeTask: (taskId: string) => void;
  uncompleteTask: (taskId: string) => void;
  addTask: (dayId: string, task: Task) => void;
  removeTask: (dayId: string, taskId: string) => void;
  setTrips: (trips: Trip[]) => void;
  setGenerationState: (jobId: string, progress: number, step: string | null) => void;
  clearGeneration: () => void;
  clearActiveTrip: () => void;
}

export const useTripStore = create<TripState>((set) => ({
  activeTripId: null,
  activeTrip: null,
  activeDays: [],
  activeDayIndex: 0,
  trips: [],
  generationJobId: null,
  generationProgress: 0,
  generationStep: null,
  isGenerating: false,

  setActiveTrip: (trip, days) =>
    set({
      activeTripId: trip.id,
      activeTrip: trip,
      activeDays: days,
      activeDayIndex: 0,
    }),

  setActiveDayIndex: (index) => set({ activeDayIndex: index }),

  updateTask: (updatedTask) =>
    set((state) => ({
      activeDays: state.activeDays.map((day) => ({
        ...day,
        tasks: day.tasks.map((t) =>
          t.id === updatedTask.id ? updatedTask : t
        ),
      })),
    })),

  reorderTasks: (dayId, orderedTaskIds) =>
    set((state) => ({
      activeDays: state.activeDays.map((day) => {
        if (day.id !== dayId) return day;
        const taskMap = new Map(day.tasks.map((t) => [t.id, t]));
        const reordered = orderedTaskIds
          .map((id, i) => {
            const task = taskMap.get(id);
            return task ? { ...task, position: i } : null;
          })
          .filter((t): t is Task => t !== null);
        return { ...day, tasks: reordered };
      }),
    })),

  completeTask: (taskId) =>
    set((state) => ({
      activeDays: state.activeDays.map((day) => ({
        ...day,
        tasks: day.tasks.map((t) =>
          t.id === taskId
            ? { ...t, isCompleted: true, completedAt: new Date().toISOString() }
            : t
        ),
      })),
    })),

  uncompleteTask: (taskId) =>
    set((state) => ({
      activeDays: state.activeDays.map((day) => ({
        ...day,
        tasks: day.tasks.map((t) =>
          t.id === taskId
            ? { ...t, isCompleted: false, completedAt: null }
            : t
        ),
      })),
    })),

  addTask: (dayId, task) =>
    set((state) => ({
      activeDays: state.activeDays.map((day) =>
        day.id === dayId
          ? { ...day, tasks: [...day.tasks, task] }
          : day
      ),
    })),

  removeTask: (dayId, taskId) =>
    set((state) => ({
      activeDays: state.activeDays.map((day) =>
        day.id === dayId
          ? { ...day, tasks: day.tasks.filter((t) => t.id !== taskId) }
          : day
      ),
    })),

  setTrips: (trips) => set({ trips }),

  setGenerationState: (jobId, progress, step) =>
    set({
      generationJobId: jobId,
      generationProgress: progress,
      generationStep: step,
      isGenerating: true,
    }),

  clearGeneration: () =>
    set({
      generationJobId: null,
      generationProgress: 0,
      generationStep: null,
      isGenerating: false,
    }),

  clearActiveTrip: () =>
    set({
      activeTripId: null,
      activeTrip: null,
      activeDays: [],
      activeDayIndex: 0,
    }),
}));

// ─── Selectors ────────────────────────────────────────────────────────────────

export const useActiveTrip = () => useTripStore((s) => s.activeTrip);
export const useActiveDays = () => useTripStore((s) => s.activeDays);
export const useActiveDay = () =>
  useTripStore((s) => s.activeDays[s.activeDayIndex] ?? null);
export const useActiveDayIndex = () => useTripStore((s) => s.activeDayIndex);
export const useIsGenerating = () => useTripStore((s) => s.isGenerating);
export const useGenerationProgress = () =>
  useTripStore((s) => ({
    progress: s.generationProgress,
    step: s.generationStep,
    jobId: s.generationJobId,
  }));

export const useDayTaskStats = (dayId: string) =>
  useTripStore((s) => {
    const day = s.activeDays.find((d) => d.id === dayId);
    if (!day) return { total: 0, completed: 0, percentage: 0 };
    const total = day.tasks.length;
    const completed = day.tasks.filter((t) => t.isCompleted).length;
    return { total, completed, percentage: total > 0 ? (completed / total) * 100 : 0 };
  });
