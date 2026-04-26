import type { ThemeTokens, ThemeName } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// SPACING & RADII — constant across all themes
// ─────────────────────────────────────────────────────────────────────────────

const CONSTANTS = {
  space_xs: 4 as const,
  space_sm: 8 as const,
  space_md: 16 as const,
  space_lg: 24 as const,
  space_xl: 32 as const,
  space_2xl: 48 as const,
  space_3xl: 64 as const,
  radius_sm: 8 as const,
  radius_md: 12 as const,
  radius_lg: 16 as const,
  radius_xl: 24 as const,
  radius_full: 999 as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// AURORA DARK — Default paid theme
// Deep space. Northern lights. Glass morphism. Teal + Purple gradients.
// ─────────────────────────────────────────────────────────────────────────────

const AURORA_DARK: ThemeTokens = {
  ...CONSTANTS,

  // Backgrounds
  bg_primary:      '#090b12',
  bg_surface:      '#0f1219',
  bg_raised:       '#141820',
  bg_glass:        'rgba(15, 18, 25, 0.07)',
  bg_glass_border: 'rgba(255, 255, 255, 0.08)',

  // Text
  text_primary:    '#F0F4FF',
  text_secondary:  '#8892B0',
  text_disabled:   '#3D4A6B',
  text_inverse:    '#090b12',

  // Brand palette
  brand_lime:      '#b8ff57',
  brand_cyan:      '#38e8d8',
  brand_coral:     '#ff5f5f',
  brand_gold:      '#f5c842',
  brand_violet:    '#9b6fff',

  // Category colours
  category_food:          '#38e8d8',
  category_landmark:      '#9b6fff',
  category_transport:     '#f5c842',
  category_culture:       '#9b6fff',
  category_budget:        '#ff5f5f',
  category_accommodation: '#f5c842',
  category_general:       '#8892B0',

  // Gradients
  gradient_primary:   ['#38e8d8', '#9b6fff'],
  gradient_hero:      ['rgba(9,11,18,0)', 'rgba(9,11,18,0.9)'],
  gradient_cta:       ['#b8ff57', '#38e8d8'],

  // Interactive
  interactive_primary:  '#b8ff57',
  interactive_hover:    '#d4ff8a',
  interactive_pressed:  '#8bc940',
  interactive_ghost:    'rgba(184, 255, 87, 0.12)',

  // Borders
  border_default:   'rgba(255, 255, 255, 0.06)',
  border_focus:     'rgba(56, 232, 216, 0.4)',
  border_error:     'rgba(255, 95, 95, 0.4)',
  border_success:   'rgba(184, 255, 87, 0.4)',

  // System
  system_success:   '#4ADE80',
  system_warning:   '#FBBF24',
  system_error:     '#ff5f5f',
  system_info:      '#38e8d8',

  // Typography
  font_display:     'Syne_800ExtraBold',
  font_serif:       'InstrumentSerif_400Italic',
  font_body:        'DMSans_400Regular',
  font_body_medium: 'DMSans_500Medium',
  font_mono:        'JetBrainsMono_400Regular',

  // Effects
  glass_opacity:    0.07,
  grain_opacity:    0.08,
  shadow_card:      '0 4px 24px rgba(0,0,0,0.4)',
  shadow_modal:     '0 8px 48px rgba(0,0,0,0.6)',
  blur_glass:       12,

  map_style_id: 'DARK_AURORA_MAP',
};

// ─────────────────────────────────────────────────────────────────────────────
// WARM SAND — Paid (Voyager+)
// Editorial travel journal. Cream paper. Analogue warmth. Earth tones.
// ─────────────────────────────────────────────────────────────────────────────

const WARM_SAND: ThemeTokens = {
  ...CONSTANTS,

  bg_primary:      '#F5F0E8',
  bg_surface:      '#EDE8DC',
  bg_raised:       '#E5DFD2',
  bg_glass:        'rgba(237, 232, 220, 0.8)',
  bg_glass_border: 'rgba(100, 85, 65, 0.12)',

  text_primary:    '#2C2416',
  text_secondary:  '#6B5E4E',
  text_disabled:   '#B5A896',
  text_inverse:    '#F5F0E8',

  brand_lime:      '#7B8B3E',
  brand_cyan:      '#5B7B8B',
  brand_coral:     '#C9613E',
  brand_gold:      '#D4843A',
  brand_violet:    '#7B6B9B',

  category_food:          '#C9613E',
  category_landmark:      '#7B8B3E',
  category_transport:     '#5B7B8B',
  category_culture:       '#7B6B9B',
  category_budget:        '#D4843A',
  category_accommodation: '#5B7B8B',
  category_general:       '#8B7B6B',

  gradient_primary:   ['#C9613E', '#D4843A'],
  gradient_hero:      ['rgba(44,36,22,0)', 'rgba(44,36,22,0.85)'],
  gradient_cta:       ['#7B8B3E', '#C9613E'],

  interactive_primary:  '#7B8B3E',
  interactive_hover:    '#9BAD4E',
  interactive_pressed:  '#5B6B2E',
  interactive_ghost:    'rgba(123, 139, 62, 0.12)',

  border_default:   'rgba(100, 85, 65, 0.15)',
  border_focus:     'rgba(91, 123, 139, 0.5)',
  border_error:     'rgba(201, 97, 62, 0.5)',
  border_success:   'rgba(123, 139, 62, 0.5)',

  system_success:   '#5B8B3E',
  system_warning:   '#D4843A',
  system_error:     '#C9613E',
  system_info:      '#5B7B8B',

  font_display:     'CormorantGaramond_700Italic',
  font_serif:       'CormorantGaramond_400Italic',
  font_body:        'Figtree_400Regular',
  font_body_medium: 'Figtree_500Medium',
  font_mono:        'JetBrainsMono_400Regular',

  glass_opacity:    0.85,
  grain_opacity:    0.12,
  shadow_card:      '0 2px 16px rgba(44,36,22,0.12)',
  shadow_modal:     '0 4px 32px rgba(44,36,22,0.2)',
  blur_glass:       8,

  map_style_id: 'WARM_SEPIA_MAP',
};

// ─────────────────────────────────────────────────────────────────────────────
// ELECTRIC — Paid (Voyager+)
// Futuristic. Neon. Cyberpunk. Near-black with scanline + grid overlay.
// ─────────────────────────────────────────────────────────────────────────────

const ELECTRIC: ThemeTokens = {
  ...CONSTANTS,

  bg_primary:      '#080808',
  bg_surface:      '#0F0F0F',
  bg_raised:       '#161616',
  bg_glass:        'rgba(15, 15, 15, 0.7)',
  bg_glass_border: 'rgba(198, 255, 0, 0.15)',

  text_primary:    '#EEFF00',
  text_secondary:  '#9CA3AF',
  text_disabled:   '#4B5563',
  text_inverse:    '#080808',

  brand_lime:      '#C6FF00',
  brand_cyan:      '#00F0FF',
  brand_coral:     '#FF2D78',
  brand_gold:      '#FF8C00',
  brand_violet:    '#BF5FFF',

  category_food:          '#FF2D78',
  category_landmark:      '#C6FF00',
  category_transport:     '#00F0FF',
  category_culture:       '#BF5FFF',
  category_budget:        '#FF8C00',
  category_accommodation: '#00F0FF',
  category_general:       '#9CA3AF',

  gradient_primary:   ['#C6FF00', '#00F0FF'],
  gradient_hero:      ['rgba(8,8,8,0)', 'rgba(8,8,8,0.95)'],
  gradient_cta:       ['#C6FF00', '#FF2D78'],

  interactive_primary:  '#C6FF00',
  interactive_hover:    '#DEFF4A',
  interactive_pressed:  '#9BC900',
  interactive_ghost:    'rgba(198, 255, 0, 0.08)',

  border_default:   'rgba(198, 255, 0, 0.1)',
  border_focus:     'rgba(0, 240, 255, 0.6)',
  border_error:     'rgba(255, 45, 120, 0.6)',
  border_success:   'rgba(198, 255, 0, 0.6)',

  system_success:   '#C6FF00',
  system_warning:   '#FF8C00',
  system_error:     '#FF2D78',
  system_info:      '#00F0FF',

  font_display:     'BarlowCondensed_900Black',
  font_serif:       'BarlowCondensed_400Regular',
  font_body:        'IBMPlexMono_400Regular',
  font_body_medium: 'IBMPlexMono_500Medium',
  font_mono:        'IBMPlexMono_400Regular',

  glass_opacity:    0.15,
  grain_opacity:    0.03,
  shadow_card:      '0 0 20px rgba(198, 255, 0, 0.1)',
  shadow_modal:     '0 0 40px rgba(0, 240, 255, 0.15)',
  blur_glass:       16,

  map_style_id: 'NIGHT_NEON_MAP',

  // Electric-specific
  scanline_opacity:    0.04,
  grid_opacity:        0.06,
  neon_glow_color:     '#C6FF00',
  neon_glow_intensity: 12,
};

// ─────────────────────────────────────────────────────────────────────────────
// DARK / LIGHT — Free tier (dark mode)
// ─────────────────────────────────────────────────────────────────────────────

const DARK_LIGHT: ThemeTokens = {
  ...CONSTANTS,

  bg_primary:      '#09090B',
  bg_surface:      '#18181B',
  bg_raised:       '#27272A',
  bg_glass:        'rgba(24, 24, 27, 0.8)',
  bg_glass_border: 'rgba(255, 255, 255, 0.06)',

  text_primary:    '#FAFAFA',
  text_secondary:  '#A1A1AA',
  text_disabled:   '#52525B',
  text_inverse:    '#09090B',

  brand_lime:      '#6366F1',
  brand_cyan:      '#06B6D4',
  brand_coral:     '#F87171',
  brand_gold:      '#FBBF24',
  brand_violet:    '#A78BFA',

  category_food:          '#22C55E',
  category_landmark:      '#8B5CF6',
  category_transport:     '#F59E0B',
  category_culture:       '#3B82F6',
  category_budget:        '#EF4444',
  category_accommodation: '#F59E0B',
  category_general:       '#A1A1AA',

  gradient_primary:   ['#6366F1', '#06B6D4'],
  gradient_hero:      ['rgba(9,9,11,0)', 'rgba(9,9,11,0.9)'],
  gradient_cta:       ['#6366F1', '#8B5CF6'],

  interactive_primary:  '#6366F1',
  interactive_hover:    '#818CF8',
  interactive_pressed:  '#4F46E5',
  interactive_ghost:    'rgba(99, 102, 241, 0.12)',

  border_default:   'rgba(255, 255, 255, 0.06)',
  border_focus:     'rgba(99, 102, 241, 0.5)',
  border_error:     'rgba(248, 113, 113, 0.5)',
  border_success:   'rgba(34, 197, 94, 0.5)',

  system_success:   '#4ADE80',
  system_warning:   '#FBBF24',
  system_error:     '#F87171',
  system_info:      '#06B6D4',

  font_display:     'DMSans_700Bold',
  font_serif:       'DMSans_400Regular',
  font_body:        'DMSans_400Regular',
  font_body_medium: 'DMSans_500Medium',
  font_mono:        'JetBrainsMono_400Regular',

  glass_opacity:    0.08,
  grain_opacity:    0.04,
  shadow_card:      '0 4px 24px rgba(0,0,0,0.5)',
  shadow_modal:     '0 8px 48px rgba(0,0,0,0.7)',
  blur_glass:       10,

  map_style_id: 'STANDARD_DARK_MAP',
};

// ─────────────────────────────────────────────────────────────────────────────
// BUBBLY — Default free theme
// Light, playful, coral + sky blue palette. Fredoka + Nunito fonts.
// ─────────────────────────────────────────────────────────────────────────────

const BUBBLY: ThemeTokens = {
  ...CONSTANTS,

  bg_primary:      '#FFFAF7',
  bg_surface:      '#FFFFFF',
  bg_raised:       '#FFF3EE',
  bg_glass:        'rgba(255,250,247,0.85)',
  bg_glass_border: 'rgba(0,0,0,0.08)',

  text_primary:    '#1A1A2E',
  text_secondary:  '#6B6B8A',
  text_disabled:   '#B8B8CC',
  text_inverse:    '#FFFFFF',

  brand_lime:      '#FFD93D',
  brand_cyan:      '#56CCF2',
  brand_coral:     '#FF6B6B',
  brand_gold:      '#FFD93D',
  brand_violet:    '#C7A7FF',

  category_food:          '#FF6B6B',
  category_landmark:      '#C7A7FF',
  category_transport:     '#56CCF2',
  category_culture:       '#C7A7FF',
  category_budget:        '#FFD93D',
  category_accommodation: '#56CCF2',
  category_general:       '#6B6B8A',

  gradient_primary:   ['#FF6B6B', '#C7A7FF'],
  gradient_hero:      ['rgba(255,250,247,0)', 'rgba(255,250,247,0.9)'],
  gradient_cta:       ['#FF6B6B', '#56CCF2'],

  interactive_primary:  '#FF6B6B',
  interactive_hover:    '#FF8E8E',
  interactive_pressed:  '#E55555',
  interactive_ghost:    'rgba(255,107,107,0.10)',

  border_default:   'rgba(26,26,46,0.12)',
  border_focus:     'rgba(255,107,107,0.5)',
  border_error:     'rgba(255,59,59,0.5)',
  border_success:   'rgba(78,205,196,0.5)',

  system_success:   '#4ECDC4',
  system_warning:   '#FFD93D',
  system_error:     '#FF3B3B',
  system_info:      '#56CCF2',

  font_display:     'Fredoka_700Bold',
  font_serif:       'Fredoka_600SemiBold',
  font_body:        'Nunito_600SemiBold',
  font_body_medium: 'Nunito_700Bold',
  font_mono:        'Nunito_800ExtraBold',

  glass_opacity:    0.85,
  grain_opacity:    0.02,
  shadow_card:      '0 4px 0 rgba(26,26,46,0.15)',
  shadow_modal:     '0 8px 32px rgba(26,26,46,0.15)',
  blur_glass:       8,

  map_style_id: 'STANDARD_MAP',
};

// ─────────────────────────────────────────────────────────────────────────────
// THEME MAP
// ─────────────────────────────────────────────────────────────────────────────

export const THEMES: Record<ThemeName, ThemeTokens> = {
  bubbly: BUBBLY,
  dark_light: DARK_LIGHT,
  aurora_dark: AURORA_DARK,
  warm_sand: WARM_SAND,
  electric: ELECTRIC,
} as const;

/** Themes that require a paid tier to unlock */
export const PAID_THEMES: ThemeName[] = ['aurora_dark', 'warm_sand', 'electric'];

/** Themes available to free (Explorer) users */
export const FREE_THEMES: ThemeName[] = ['bubbly', 'dark_light'];

export const DEFAULT_THEME: ThemeName = 'bubbly';

/** Returns true if theme requires Voyager or higher */
export function isPaidTheme(themeName: ThemeName): boolean {
  return PAID_THEMES.includes(themeName);
}

export type { ThemeTokens, ThemeName };
