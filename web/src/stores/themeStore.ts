import { create } from 'zustand';
import type { ThemeName } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// THEME STORE — lightweight store for theme name & transition state
// The full ThemeProvider handles tokens + MMKV persistence.
// This store is for components that need to read themeName without
// subscribing to the full theme token tree.
// ─────────────────────────────────────────────────────────────────────────────

interface ThemeStoreState {
  themeName: ThemeName;
  isTransitioning: boolean;
  setThemeName: (name: ThemeName) => void;
  setTransitioning: (transitioning: boolean) => void;
}

export const useThemeStore = create<ThemeStoreState>((set) => ({
  themeName: 'dark_light',
  isTransitioning: false,
  setThemeName: (themeName) => set({ themeName }),
  setTransitioning: (isTransitioning) => set({ isTransitioning }),
}));

export const useThemeName = () => useThemeStore((s) => s.themeName);
export const useIsThemeTransitioning = () =>
  useThemeStore((s) => s.isTransitioning);
