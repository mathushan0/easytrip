import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import type { User, UserTier, Entitlements } from '@/types';

const storage = new MMKV({ id: 'user-storage' });
const USER_KEY = 'current_user';
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// ─── Entitlements map ─────────────────────────────────────────────────────────

function computeEntitlements(tier: UserTier): Entitlements {
  const isVoyager = tier === 'voyager' || tier === 'nomad_pro';
  const isPro = tier === 'nomad_pro';
  return {
    tier,
    canCreateTrips:       true,
    maxTripDays:          tier === 'explorer' ? 3 : null,
    maxActiveTrips:       tier === 'explorer' ? 3 : null,
    hasThemes:            isVoyager,
    hasCameraTranslate:   isVoyager,
    hasOfflinePacks:      isVoyager,
    hasDragToReorder:     isVoyager,
    hasSocialIntelligence: isPro,
    hasAiAssistant:       isPro,
    hasRealtimeDisruptions: isPro,
    hasExport:            isVoyager,
  };
}

// ─── State ────────────────────────────────────────────────────────────────────

interface UserState {
  user: User | null;
  authToken: string | null;
  refreshToken: string | null;
  entitlements: Entitlements;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User) => void;
  setAuthTokens: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateUser: (updates: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
}

function loadUser(): User | null {
  const raw = storage.getString(USER_KEY);
  if (raw) {
    try { return JSON.parse(raw) as User; }
    catch { return null; }
  }
  return null;
}

const GUEST_ENTITLEMENTS = computeEntitlements('explorer');

export const useUserStore = create<UserState>((set) => {
  const storedUser = loadUser();
  const storedToken = storage.getString(TOKEN_KEY) ?? null;
  const storedRefresh = storage.getString(REFRESH_TOKEN_KEY) ?? null;

  return {
    user: storedUser,
    authToken: storedToken,
    refreshToken: storedRefresh,
    entitlements: storedUser ? computeEntitlements(storedUser.tier) : GUEST_ENTITLEMENTS,
    isAuthenticated: !!storedUser && !!storedToken,
    isLoading: false,

    setUser: (user) => {
      storage.set(USER_KEY, JSON.stringify(user));
      set({
        user,
        entitlements: computeEntitlements(user.tier),
        isAuthenticated: true,
      });
    },

    setAuthTokens: (accessToken, refreshToken) => {
      storage.set(TOKEN_KEY, accessToken);
      storage.set(REFRESH_TOKEN_KEY, refreshToken);
      set({ authToken: accessToken, refreshToken });
    },

    clearAuth: () => {
      storage.delete(USER_KEY);
      storage.delete(TOKEN_KEY);
      storage.delete(REFRESH_TOKEN_KEY);
      set({
        user: null,
        authToken: null,
        refreshToken: null,
        entitlements: GUEST_ENTITLEMENTS,
        isAuthenticated: false,
      });
    },

    updateUser: (updates) => {
      set((state) => {
        if (!state.user) return state;
        const updated = { ...state.user, ...updates };
        storage.set(USER_KEY, JSON.stringify(updated));
        return {
          user: updated,
          entitlements: computeEntitlements(updated.tier),
        };
      });
    },

    setLoading: (loading) => set({ isLoading: loading }),
  };
});

// ─── Selectors ────────────────────────────────────────────────────────────────

export const useCurrentUser = () => useUserStore((s) => s.user);
export const useAuthToken = () => useUserStore((s) => s.authToken);
export const useIsAuthenticated = () => useUserStore((s) => s.isAuthenticated);
export const useEntitlements = () => useUserStore((s) => s.entitlements);
export const useUserTier = (): UserTier =>
  useUserStore((s) => s.user?.tier ?? 'explorer');
export const useCanAccess = (feature: keyof Entitlements) =>
  useUserStore((s) => Boolean(s.entitlements[feature]));
