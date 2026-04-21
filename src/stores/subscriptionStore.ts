import { create } from 'zustand';
import type { Subscription, ProductId, SubscriptionStatus } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION STORE — payment + subscription state
// ─────────────────────────────────────────────────────────────────────────────

interface SubscriptionState {
  subscription: Subscription | null;
  isPurchasing: boolean;
  purchaseError: string | null;
  lastVerified: string | null; // ISO timestamp

  // Actions
  setSubscription: (sub: Subscription | null) => void;
  setPurchasing: (purchasing: boolean) => void;
  setPurchaseError: (error: string | null) => void;
  setLastVerified: (timestamp: string) => void;
  clearSubscription: () => void;

  // Derived helpers
  isActive: () => boolean;
  productId: () => ProductId | null;
  status: () => SubscriptionStatus | null;
  willRenew: () => boolean;
  daysUntilExpiry: () => number | null;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscription: null,
  isPurchasing: false,
  purchaseError: null,
  lastVerified: null,

  setSubscription: (subscription) => set({ subscription }),

  setPurchasing: (isPurchasing) => set({ isPurchasing }),

  setPurchaseError: (purchaseError) => set({ purchaseError }),

  setLastVerified: (lastVerified) => set({ lastVerified }),

  clearSubscription: () =>
    set({ subscription: null, purchaseError: null, isPurchasing: false }),

  isActive: () => {
    const sub = get().subscription;
    if (!sub) return false;
    return sub.status === 'active';
  },

  productId: () => get().subscription?.productId ?? null,

  status: () => get().subscription?.status ?? null,

  willRenew: () => {
    const sub = get().subscription;
    if (!sub) return false;
    return sub.status === 'active' && !sub.cancelAtPeriodEnd;
  },

  daysUntilExpiry: () => {
    const sub = get().subscription;
    if (!sub?.currentPeriodEnd) return null; // lifetime
    const end = new Date(sub.currentPeriodEnd);
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  },
}));

export const useSubscription = () =>
  useSubscriptionStore((s) => s.subscription);
export const useIsPurchasing = () =>
  useSubscriptionStore((s) => s.isPurchasing);
export const useIsSubscriptionActive = () =>
  useSubscriptionStore((s) => s.isActive());
