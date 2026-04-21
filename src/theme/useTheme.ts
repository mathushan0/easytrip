import { useThemeContext } from './ThemeProvider';
import type { ThemeContextType, ThemeTokens, CategoryKey } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// useTheme — Primary hook for accessing the current theme in all components
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the full theme context including tokens, name, setTheme, and helpers.
 *
 * @example
 * const { theme, themeName, setTheme, resolvedCategoryColour } = useTheme();
 * const style = { backgroundColor: theme.bg_surface };
 * const foodColour = resolvedCategoryColour('food');
 */
export function useTheme(): ThemeContextType {
  return useThemeContext();
}

/**
 * Returns only the theme tokens (most common use case).
 * More granular than useTheme() to keep re-renders minimal.
 */
export function useThemeTokens(): ThemeTokens {
  return useThemeContext().theme;
}

/**
 * Returns the glass card style object, ready to spread into StyleSheet.
 * Handles the repeating glass morphism pattern across all themes.
 */
export function useGlassStyle(): {
  backgroundColor: string;
  borderWidth: number;
  borderColor: string;
} {
  const { theme } = useThemeContext();
  return {
    backgroundColor: theme.bg_glass,
    borderWidth: 1,
    borderColor: theme.bg_glass_border,
  };
}

/**
 * Returns the colour for a given task/venue category,
 * respecting per-user colour overrides.
 */
export function useCategoryColour(category: CategoryKey): string {
  return useThemeContext().resolvedCategoryColour(category);
}

export { useThemeContext };
export type { ThemeContextType };
