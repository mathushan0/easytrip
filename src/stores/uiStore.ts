import { create } from 'zustand';

// ─────────────────────────────────────────────────────────────────────────────
// UI STORE — transient UI state (modals, toasts, bottom sheets, network)
// ─────────────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  durationMs: number;
}

export type UpsellFeature =
  | 'unlimited_trips'
  | 'trip_duration'
  | 'themes'
  | 'camera_translate'
  | 'offline_packs'
  | 'drag_reorder'
  | 'social_intelligence'
  | 'ai_assistant'
  | 'realtime_disruptions'
  | 'export';

interface UiState {
  // Network
  isOnline: boolean;

  // Toast queue
  toasts: Toast[];

  // Modals
  upsellVisible: boolean;
  upsellFeature: UpsellFeature | null;

  // Active bottom sheet
  activeBottomSheet: string | null;

  // Tab bar visibility (hide during certain interactions)
  tabBarVisible: boolean;

  // Actions
  setOnline: (online: boolean) => void;
  showToast: (message: string, type?: ToastType, durationMs?: number) => void;
  dismissToast: (id: string) => void;
  showUpsell: (feature: UpsellFeature) => void;
  hideUpsell: () => void;
  openBottomSheet: (sheetId: string) => void;
  closeBottomSheet: () => void;
  setTabBarVisible: (visible: boolean) => void;
}

let toastIdCounter = 0;

export const useUiStore = create<UiState>((set) => ({
  isOnline: true,
  toasts: [],
  upsellVisible: false,
  upsellFeature: null,
  activeBottomSheet: null,
  tabBarVisible: true,

  setOnline: (isOnline) => set({ isOnline }),

  showToast: (message, type = 'info', durationMs = 4000) => {
    const id = String(++toastIdCounter);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, durationMs }],
    }));
  },

  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  showUpsell: (feature) =>
    set({ upsellVisible: true, upsellFeature: feature }),

  hideUpsell: () =>
    set({ upsellVisible: false, upsellFeature: null }),

  openBottomSheet: (sheetId) =>
    set({ activeBottomSheet: sheetId }),

  closeBottomSheet: () =>
    set({ activeBottomSheet: null }),

  setTabBarVisible: (tabBarVisible) => set({ tabBarVisible }),
}));

// ─── Selectors ────────────────────────────────────────────────────────────────

export const useIsOnline = () => useUiStore((s) => s.isOnline);
export const useToasts = () => useUiStore((s) => s.toasts);
export const useUpsellState = () =>
  useUiStore((s) => ({ visible: s.upsellVisible, feature: s.upsellFeature }));
export const useShowToast = () => useUiStore((s) => s.showToast);
export const useShowUpsell = () => useUiStore((s) => s.showUpsell);

// ─────────────────────────────────────────────────────────────────────────────
// CONSENT STORE
// Lightweight store for user consent choices (analytics, crash, push)
// Written during ConsentScreen; persisted to MMKV + synced to backend
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';

const consentStorage = new MMKV({ id: 'consent-storage' });
const CONSENT_KEY = 'user_consent';

export interface ConsentChoices {
  analytics: boolean;
  crashReports: boolean;
  pushNotifications: boolean;
}

interface ConsentState {
  consent: ConsentChoices | null;
  hasShownConsentScreen: boolean;
  setConsent: (choices: ConsentChoices) => void;
  markConsentShown: () => void;
}

function loadConsent(): ConsentChoices | null {
  const raw = consentStorage.getString(CONSENT_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as ConsentChoices;
    } catch {
      return null;
    }
  }
  return null;
}

export const useConsentStore = create<ConsentState>((set) => ({
  consent: loadConsent(),
  hasShownConsentScreen: consentStorage.getBoolean('consent_shown') ?? false,

  setConsent: (choices) => {
    consentStorage.set(CONSENT_KEY, JSON.stringify(choices));
    set({ consent: choices });
  },

  markConsentShown: () => {
    consentStorage.set('consent_shown', true);
    set({ hasShownConsentScreen: true });
  },
}));
