// ─────────────────────────────────────────────────────────────────────────────
// EASYTRIP — IN-APP PURCHASE SERVICE
// Wraps expo-in-app-purchases for iOS (StoreKit 2) and Android (Google Play).
// ─────────────────────────────────────────────────────────────────────────────

import * as InAppPurchases from 'expo-in-app-purchases';
import { Platform } from 'react-native';
import { subscriptionApi } from './apiClient';
import type { UserTier } from '@/types';

// ─── Product IDs ─────────────────────────────────────────────────────────────

// iOS uses reverse-domain product IDs; Android uses the same string.
export const IAP_PRODUCT_IDS = {
  VOYAGER_LIFETIME: 'com.easytrip.app.voyager_lifetime',
  NOMAD_PRO_MONTHLY: 'com.easytrip.app.nomad_pro_monthly',
  NOMAD_PRO_ANNUAL: 'com.easytrip.app.nomad_pro_annual',
} as const;

export type IapProductId = (typeof IAP_PRODUCT_IDS)[keyof typeof IAP_PRODUCT_IDS];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IapProduct {
  productId: IapProductId;
  title: string;
  description: string;
  price: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
}

export interface PurchaseResult {
  success: boolean;
  tier: UserTier | null;
  error: string | null;
  productId: IapProductId | null;
}

// ─── State ────────────────────────────────────────────────────────────────────

let _isConnected = false;
let _purchaseListener: InAppPurchases.PurchaseUpdatedListener | null = null;

// ─── Init / Teardown ─────────────────────────────────────────────────────────

/**
 * Connect to the store. Call once from App.tsx or a top-level hook.
 * Safe to call multiple times — no-ops if already connected.
 */
export async function connectToStore(): Promise<void> {
  if (_isConnected) return;
  try {
    await InAppPurchases.connectAsync();
    _isConnected = true;
  } catch (err) {
    console.warn('[IAP] Failed to connect to store:', err);
  }
}

/**
 * Disconnect from the store. Call on app backgrounding or unmount.
 */
export async function disconnectFromStore(): Promise<void> {
  if (!_isConnected) return;
  try {
    if (_purchaseListener) {
      InAppPurchases.removePurchaseUpdatedListener(_purchaseListener);
      _purchaseListener = null;
    }
    await InAppPurchases.disconnectAsync();
    _isConnected = false;
  } catch (err) {
    console.warn('[IAP] Failed to disconnect from store:', err);
  }
}

// ─── Get available products ───────────────────────────────────────────────────

export async function getProducts(): Promise<IapProduct[]> {
  if (!_isConnected) await connectToStore();

  const productIds = Object.values(IAP_PRODUCT_IDS);
  const { responseCode, results } = await InAppPurchases.getProductsAsync(productIds);

  if (responseCode !== InAppPurchases.IAPResponseCode.OK) {
    throw new Error(`[IAP] getProductsAsync failed with code ${responseCode}`);
  }

  return (results ?? []).map((p) => ({
    productId: p.productId as IapProductId,
    title: p.title,
    description: p.description,
    price: p.price,
    priceAmountMicros: p.priceAmountMicros ?? 0,
    priceCurrencyCode: p.priceCurrencyCode ?? 'GBP',
  }));
}

// ─── Purchase flow ────────────────────────────────────────────────────────────

/**
 * Initiate a purchase and verify it server-side.
 * Returns a PurchaseResult with the unlocked tier on success.
 */
export function purchaseProduct(productId: IapProductId): Promise<PurchaseResult> {
  return new Promise(async (resolve) => {
    if (!_isConnected) await connectToStore();

    // Remove any stale listener
    if (_purchaseListener) {
      InAppPurchases.removePurchaseUpdatedListener(_purchaseListener);
      _purchaseListener = null;
    }

    // Set up purchase listener BEFORE calling purchaseItemAsync
    _purchaseListener = InAppPurchases.setPurchaseListener(
      async ({ responseCode, results, errorCode }) => {
        if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
          resolve({ success: false, tier: null, error: 'Purchase cancelled', productId });
          return;
        }

        if (
          responseCode !== InAppPurchases.IAPResponseCode.OK ||
          !results?.length
        ) {
          resolve({
            success: false,
            tier: null,
            error: `Purchase failed (code: ${responseCode}, error: ${errorCode})`,
            productId,
          });
          return;
        }

        const purchase = results[0];

        // Determine receipt data per platform
        const receiptData =
          Platform.OS === 'ios'
            ? purchase.transactionReceipt ?? ''
            : purchase.purchaseToken ?? '';

        if (!receiptData) {
          resolve({ success: false, tier: null, error: 'No receipt data', productId });
          return;
        }

        try {
          // Verify server-side
          const verifyResult = await subscriptionApi.verifyIap({
            platform: Platform.OS as 'ios' | 'android',
            productId: purchase.productId,
            receiptData,
          });

          if (verifyResult.success) {
            // Acknowledge the purchase (required to prevent refund loop)
            await InAppPurchases.finishTransactionAsync(purchase, false);
            resolve({
              success: true,
              tier: verifyResult.tier as UserTier,
              error: null,
              productId: purchase.productId as IapProductId,
            });
          } else {
            resolve({ success: false, tier: null, error: 'Server verification failed', productId });
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Verification error';
          resolve({ success: false, tier: null, error: message, productId });
        }
      },
    );

    // Initiate the purchase
    try {
      await InAppPurchases.purchaseItemAsync(productId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Purchase initiation failed';
      resolve({ success: false, tier: null, error: message, productId });
    }
  });
}

// ─── Restore purchases ────────────────────────────────────────────────────────

/**
 * Restore previous purchases. Useful for "Restore Purchases" button in Settings.
 */
export async function restorePurchases(): Promise<PurchaseResult[]> {
  if (!_isConnected) await connectToStore();

  const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();

  if (responseCode !== InAppPurchases.IAPResponseCode.OK || !results?.length) {
    return [];
  }

  const restoreResults: PurchaseResult[] = [];

  for (const purchase of results) {
    const receiptData =
      Platform.OS === 'ios'
        ? purchase.transactionReceipt ?? ''
        : purchase.purchaseToken ?? '';

    if (!receiptData) continue;

    try {
      const verifyResult = await subscriptionApi.verifyIap({
        platform: Platform.OS as 'ios' | 'android',
        productId: purchase.productId,
        receiptData,
      });

      restoreResults.push({
        success: verifyResult.success,
        tier: verifyResult.success ? (verifyResult.tier as UserTier) : null,
        error: verifyResult.success ? null : 'Verification failed',
        productId: purchase.productId as IapProductId,
      });
    } catch {
      restoreResults.push({
        success: false,
        tier: null,
        error: 'Restore verification error',
        productId: purchase.productId as IapProductId,
      });
    }
  }

  return restoreResults;
}

// ─── React hook ───────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';

export function useIapProducts(): { products: IapProduct[]; loading: boolean; error: string | null } {
  const [products, setProducts] = useState<IapProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProducts()
      .then((p) => { if (!cancelled) setProducts(p); })
      .catch((err) => { if (!cancelled) setError(err?.message ?? 'Failed to load products'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { products, loading, error };
}
