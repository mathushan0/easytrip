// ─────────────────────────────────────────────────────────────────────────────
// FONTS — EasyTrip font configuration
// Fredoka for titles/labels/buttons, Nunito for body text
// ─────────────────────────────────────────────────────────────────────────────

import {
  useFonts,
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
} from '@expo-google-fonts/fredoka';

import {
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';

export { useFonts };

/**
 * All font assets required before the app renders.
 * Pass to useFonts() in App.tsx.
 */
export const APP_FONTS = {
  // Fredoka — titles, labels, buttons
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
  // Nunito — body text
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} as const;

// ─── Font family name constants ───────────────────────────────────────────────

export const FONT_FAMILIES = {
  // Titles, labels, buttons
  fredokaMedium:   'Fredoka_500Medium',
  fredokaSemiBold: 'Fredoka_600SemiBold',
  fredokaBold:     'Fredoka_700Bold',
  // Body text
  nunitoSemiBold:  'Nunito_600SemiBold',
  nunitoBold:      'Nunito_700Bold',
  nunitoExtraBold: 'Nunito_800ExtraBold',
  nunitoBlack:     'Nunito_900Black',
} as const;

// ─── Typography scale ─────────────────────────────────────────────────────────

export const TYPE_SCALE = {
  heroDisplay:    { fontSize: 40, lineHeight: 44 },
  screenTitle:    { fontSize: 28, lineHeight: 34 },
  sectionHeading: { fontSize: 22, lineHeight: 28 },
  cardTitle:      { fontSize: 18, lineHeight: 24 },
  accentLarge:    { fontSize: 24, lineHeight: 31 },
  accentSmall:    { fontSize: 18, lineHeight: 25 },
  bodyLarge:      { fontSize: 17, lineHeight: 27 },
  bodyRegular:    { fontSize: 15, lineHeight: 24 },
  bodyMedium:     { fontSize: 15, lineHeight: 24 },
  caption:        { fontSize: 13, lineHeight: 20 },
  labelTag:       { fontSize: 11, lineHeight: 15 },
} as const;

export type TypeScaleKey = keyof typeof TYPE_SCALE;

/**
 * Hook: returns [fontsLoaded, fontError].
 * Use in App.tsx to gate rendering until fonts are ready.
 *
 * @example
 * const [fontsLoaded, fontError] = useAppFonts();
 * if (!fontsLoaded && !fontError) return null;
 */
export function useAppFonts(): [boolean, Error | null] {
  const [loaded, error] = useFonts(APP_FONTS);
  return [loaded, error];
}
