// ─────────────────────────────────────────────────────────────────────────────
// TOP HEADER NAV
// Coral red background, wavy SVG bottom edge (6-8 bumps)
// LIK badge left, EasyTrip wordmark centre (Trip in yellow), bell + profile right
// Bell shows badge only if push consent ON
// Fixed at top, never scrolls
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { LIKBadge } from '@components/shared/LIKBadge';
import { useTheme } from '@theme/useTheme';
import { FONT_FAMILIES } from '@theme/fonts';
import { useConsentStore } from '@stores/uiStore';
import { useUserStore } from '@stores/userStore';

interface TopHeaderNavProps {
  notificationCount?: number;
  onBellPress?: () => void;
  onProfilePress?: () => void;
}

const HEADER_HEIGHT = 64;
const WAVE_HEIGHT = 18;

/**
 * Wavy SVG bottom edge with ~7 bumps.
 * Width is hardcoded to 400 (will stretch via viewBox).
 */
function WavyEdge({ color }: { color: string }): React.ReactElement {
  return (
    <Svg
      width="100%"
      height={WAVE_HEIGHT}
      viewBox="0 0 400 18"
      preserveAspectRatio="none"
      style={styles.wave}
    >
      <Path
        d="M0 0 C28 18 56 0 84 0 C112 18 140 0 168 0 C196 18 224 0 252 0 C280 18 308 0 336 0 C364 18 392 0 400 0 L400 18 L0 18 Z"
        fill={color}
      />
    </Svg>
  );
}

export function TopHeaderNav({
  notificationCount = 0,
  onBellPress,
  onProfilePress,
}: TopHeaderNavProps): React.ReactElement {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const consent = useConsentStore((s) => s.consent);
  const user = useUserStore((s) => s.user);

  const CORAL = '#FF6B6B';
  const topPadding = insets.top;

  const showBadge = !!consent?.pushNotifications && notificationCount > 0;

  // User avatar: initials fallback
  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <View style={[styles.wrapper, { paddingTop: topPadding }]}>
      {/* Coral bar */}
      <View
        style={[
          styles.bar,
          { backgroundColor: CORAL, height: HEADER_HEIGHT + topPadding },
        ]}
      >
        {/* Actual content row (below safe area) */}
        <View style={[styles.row, { marginTop: topPadding }]}>
          {/* Left — LIK badge */}
          <LIKBadge size="nav" />

          {/* Centre — Wordmark */}
          <View style={styles.wordmarkContainer}>
            <Text style={[styles.wordmarkEasy, { fontFamily: FONT_FAMILIES.fredokaBold }]}>
              Easy
            </Text>
            <Text
              style={[
                styles.wordmarkTrip,
                { fontFamily: FONT_FAMILIES.fredokaBold, color: '#FFD93D' },
              ]}
            >
              Trip
            </Text>
          </View>

          {/* Right — Bell + Profile */}
          <View style={styles.rightActions}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={onBellPress}
              accessibilityLabel="Notifications"
            >
              <Text style={styles.bellIcon}>🔔</Text>
              {showBadge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatar}
              onPress={onProfilePress}
              accessibilityLabel="Profile"
            >
              <Text
                style={[
                  styles.avatarText,
                  { fontFamily: FONT_FAMILIES.fredokaBold },
                ]}
              >
                {initials}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Wavy bottom edge — same coral colour */}
      <WavyEdge color={CORAL} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  bar: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: HEADER_HEIGHT,
  },
  wave: {
    marginTop: -1, // eliminate 1px gap
  },
  wordmarkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordmarkEasy: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  wordmarkTrip: {
    fontSize: 24,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    fontSize: 22,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B3B',
    borderRadius: 99,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFD93D',
    borderWidth: 2,
    borderColor: '#1A1A2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    color: '#1A1A2E',
  },
});
