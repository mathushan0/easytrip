// ─────────────────────────────────────────────────────────────────────────────
// SHARED — ConsentGate
// Wraps analytics-dependent features.
// Renders nothing if the user hasn't consented to analytics.
// No data is logged if consent is not given.
// ─────────────────────────────────────────────────────────────────────────────

import React, { type PropsWithChildren } from 'react';
import { useConsentStore } from '@stores/uiStore';

interface ConsentGateProps extends PropsWithChildren {
  /** Which consent type gates this feature */
  require?: 'analytics' | 'crashReports' | 'pushNotifications';
  /** Optional fallback when consent not given */
  fallback?: React.ReactElement | null;
}

/**
 * Renders children only when the required consent has been granted.
 * Falls back to `fallback` (default: null) when consent is absent.
 *
 * @example
 * <ConsentGate require="analytics">
 *   <PostHogSessionReplay />
 * </ConsentGate>
 */
export function ConsentGate({
  children,
  require: requiredConsent = 'analytics',
  fallback = null,
}: ConsentGateProps): React.ReactElement | null {
  const consent = useConsentStore((s) => s.consent);

  if (!consent) return fallback;

  switch (requiredConsent) {
    case 'analytics':
      if (!consent.analytics) return fallback;
      break;
    case 'crashReports':
      if (!consent.crashReports) return fallback;
      break;
    case 'pushNotifications':
      if (!consent.pushNotifications) return fallback;
      break;
  }

  return <>{children}</>;
}
