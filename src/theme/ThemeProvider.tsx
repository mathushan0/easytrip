import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { MMKV } from 'react-native-mmkv';
import { THEMES, DEFAULT_THEME, isPaidTheme } from './tokens';
import type {
  ThemeContextType,
  ThemeName,
  ThemeTokens,
  CategoryKey,
  CategoryColours,
} from '@/types';
import { useUserTier } from '@stores/userStore';

// ─── Storage ─────────────────────────────────────────────────────────────────

const storage = new MMKV({ id: 'theme-storage' });

const THEME_KEY = 'active_theme';
const CATEGORY_COLOURS_KEY = 'category_colours';

function loadThemeName(): ThemeName {
  const stored = storage.getString(THEME_KEY) as ThemeName | undefined;
  if (stored && stored in THEMES) return stored;
  return DEFAULT_THEME;
}

function saveThemeName(name: ThemeName): void {
  storage.set(THEME_KEY, name);
}

function loadCategoryColours(themeName: ThemeName): Partial<CategoryColours> {
  const raw = storage.getString(`${CATEGORY_COLOURS_KEY}:${themeName}`);
  if (raw) {
    try {
      return JSON.parse(raw) as Partial<CategoryColours>;
    } catch {
      return {};
    }
  }
  return {};
}

function saveCategoryColours(
  themeName: ThemeName,
  colours: Partial<CategoryColours>
): void {
  storage.set(
    `${CATEGORY_COLOURS_KEY}:${themeName}`,
    JSON.stringify(colours)
  );
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: PropsWithChildren): React.ReactElement {
  const tier = useUserTier();

  const [themeName, setThemeNameState] = useState<ThemeName>(() => {
    const stored = loadThemeName();
    // Gate paid themes for Explorer tier
    if (tier === 'explorer' && isPaidTheme(stored)) {
      return DEFAULT_THEME;
    }
    return stored;
  });

  const [categoryColours, setCategoryColoursState] = useState<Partial<CategoryColours>>(
    () => loadCategoryColours(themeName)
  );

  // Resolved theme tokens with category colour overrides applied
  const theme = useMemo<ThemeTokens>(() => {
    const base = THEMES[themeName];
    return {
      ...base,
      category_food:          categoryColours.food          ?? base.category_food,
      category_landmark:      categoryColours.landmark      ?? base.category_landmark,
      category_transport:     categoryColours.transport     ?? base.category_transport,
      category_culture:       categoryColours.culture       ?? base.category_culture,
      category_budget:        categoryColours.budget        ?? base.category_budget,
      category_accommodation: categoryColours.accommodation ?? base.category_accommodation,
      category_general:       categoryColours.general       ?? base.category_general,
    };
  }, [themeName, categoryColours]);

  const setTheme = useCallback(
    (name: ThemeName) => {
      if (tier === 'explorer' && isPaidTheme(name)) {
        // Silently refuse — callers should show upsell before calling setTheme
        return;
      }
      saveThemeName(name);
      setThemeNameState(name);
      // Load category colours for the new theme
      const newColours = loadCategoryColours(name);
      setCategoryColoursState(newColours);
      // Non-blocking server sync (fire-and-forget)
      syncThemeToServer(name).catch(() => undefined);
    },
    [tier]
  );

  const setCategoryColour = useCallback(
    (category: CategoryKey, colour: string) => {
      setCategoryColoursState((prev) => {
        const next = { ...prev, [category]: colour };
        saveCategoryColours(themeName, next);
        // Non-blocking server sync
        syncCategoryColoursToServer(themeName, next).catch(() => undefined);
        return next;
      });
    },
    [themeName]
  );

  const resolvedCategoryColour = useCallback(
    (category: CategoryKey): string => {
      const key = `category_${category}` as keyof ThemeTokens;
      return theme[key] as string;
    },
    [theme]
  );

  const value = useMemo<ThemeContextType>(
    () => ({
      theme,
      themeName,
      setTheme,
      categoryColours,
      setCategoryColour,
      resolvedCategoryColour,
    }),
    [theme, themeName, setTheme, categoryColours, setCategoryColour, resolvedCategoryColour]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useThemeContext(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return ctx;
}

// ─── Server sync helpers (fire-and-forget) ───────────────────────────────────

async function syncThemeToServer(theme: ThemeName): Promise<void> {
  // Imported lazily to avoid circular deps
  const { apiClient } = await import('@services/apiClient');
  await apiClient.patch('/settings/theme', { theme });
}

async function syncCategoryColoursToServer(
  _theme: ThemeName,
  colours: Partial<CategoryColours>
): Promise<void> {
  const { apiClient } = await import('@services/apiClient');
  await apiClient.patch('/settings/category-colours', { colours });
}
