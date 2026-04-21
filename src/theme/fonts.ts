// ─────────────────────────────────────────────────────────────────────────────
// FONTS — Theme-aware font config for EasyTrip
// ─────────────────────────────────────────────────────────────────────────────

import type { ThemeName } from '@/types';

export interface FontConfig {
  /** Bold display headlines — Syne 800 / Cormorant / BarlowCondensed */
  display: string;
  /** Italic serif accent — Instrument Serif / Cormorant */
  serif: string;
  /** Body regular */
  body: string;
  /** Body medium weight */
  bodyMedium: string;
  /** Body bold */
  bodyBold: string;
  /** Monospace — JetBrains / IBM Plex Mono */
  mono: string;
}

/** Font families per theme */
export const THEME_FONTS: Record<ThemeName, FontConfig> = {
  dark_light: {
    display:    'DMSans_700Bold',
    serif:      'DMSans_400Regular',
    body:       'DMSans_400Regular',
    bodyMedium: 'DMSans_500Medium',
    bodyBold:   'DMSans_700Bold',
    mono:       'JetBrainsMono_400Regular',
  },
  aurora_dark: {
    display:    'Syne_800ExtraBold',
    serif:      'InstrumentSerif_400Italic',
    body:       'DMSans_400Regular',
    bodyMedium: 'DMSans_500Medium',
    bodyBold:   'DMSans_700Bold',
    mono:       'JetBrainsMono_400Regular',
  },
  warm_sand: {
    display:    'CormorantGaramond_700Italic',
    serif:      'CormorantGaramond_400Italic',
    body:       'Figtree_400Regular',
    bodyMedium: 'Figtree_500Medium',
    bodyBold:   'Figtree_500Medium',
    mono:       'JetBrainsMono_400Regular',
  },
  electric: {
    display:    'BarlowCondensed_900Black',
    serif:      'BarlowCondensed_400Regular',
    body:       'IBMPlexMono_400Regular',
    bodyMedium: 'IBMPlexMono_500Medium',
    bodyBold:   'IBMPlexMono_500Medium',
    mono:       'IBMPlexMono_400Regular',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// TYPOGRAPHY SCALE
// ─────────────────────────────────────────────────────────────────────────────

export const TYPE_SCALE = {
  heroDisplay:     { fontSize: 40, lineHeight: 44 },
  screenTitle:     { fontSize: 28, lineHeight: 34 },
  sectionHeading:  { fontSize: 22, lineHeight: 28 },
  cardTitle:       { fontSize: 18, lineHeight: 24 },
  accentLarge:     { fontSize: 24, lineHeight: 31 },
  accentSmall:     { fontSize: 18, lineHeight: 25 },
  bodyLarge:       { fontSize: 17, lineHeight: 27 },
  bodyRegular:     { fontSize: 15, lineHeight: 24 },
  bodyMedium:      { fontSize: 15, lineHeight: 24 },
  caption:         { fontSize: 13, lineHeight: 20 },
  labelTag:        { fontSize: 11, lineHeight: 15 },
  codeData:        { fontSize: 13, lineHeight: 20 },
} as const;

export type TypeScaleKey = keyof typeof TYPE_SCALE;
