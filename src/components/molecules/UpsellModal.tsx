import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  type ViewStyle,
} from 'react-native';
import { X, Check, Lock, Zap } from 'lucide-react-native';
import { useTheme } from '@theme/useTheme';
import { Button } from '../atoms/Button';
import type { UserTier } from '@/types';
import type { UpsellFeature } from '@stores/uiStore';

// ─── Feature content map ──────────────────────────────────────────────────────

interface UpsellContent {
  headline: string;
  featureName: string;
  body: string;
  bullets: string[];
  requiredTier: Extract<UserTier, 'voyager' | 'nomad_pro'>;
  ctaMonthly: string;
  ctaAnnual: string;
  priceMonthly: string;
  priceAnnual: string;
  icon: string;
}

const UPSELL_CONTENT: Record<UpsellFeature, UpsellContent> = {
  unlimited_trips: {
    headline: "Keep exploring",
    featureName: "Unlimited Trips",
    body: "You've made 3 trips — and you're just getting started. Unlock unlimited trip creation and plan every adventure.",
    bullets: ["Unlimited trips", "Up to 14-day itineraries", "Export to PDF"],
    requiredTier: 'voyager',
    icon: '✈️',
    ctaMonthly: 'Unlock Voyager · £4.99',
    ctaAnnual: '£4.99 one-time (lifetime)',
    priceMonthly: '£4.99',
    priceAnnual: '£4.99 lifetime',
  },
  trip_duration: {
    headline: "Plan longer trips",
    featureName: "Extended Itineraries",
    body: "Free plan covers 3 days. Unlock Voyager for trips up to 14 days — perfect for that big adventure.",
    bullets: ["Up to 14-day itineraries", "Unlimited trips", "Offline access"],
    requiredTier: 'voyager',
    icon: '📅',
    ctaMonthly: 'Unlock Voyager · £4.99',
    ctaAnnual: '£4.99 one-time (lifetime)',
    priceMonthly: '£4.99',
    priceAnnual: '£4.99 lifetime',
  },
  themes: {
    headline: "Make it yours",
    featureName: "Premium Themes",
    body: "Aurora Dark, Warm Sand, and Electric are waiting. Transform your app into something extraordinary.",
    bullets: ["3 premium themes", "Custom category colours", "Aurora orb animations"],
    requiredTier: 'voyager',
    icon: '🎨',
    ctaMonthly: 'Unlock Voyager · £4.99',
    ctaAnnual: '£4.99 one-time (lifetime)',
    priceMonthly: '£4.99',
    priceAnnual: '£4.99 lifetime',
  },
  camera_translate: {
    headline: "Point and translate",
    featureName: "Camera Translate",
    body: "Point your camera at any sign, menu, or text for instant real-time translation. Essential for travel.",
    bullets: ["Real-time camera translation", "Works offline (after download)", "50+ languages"],
    requiredTier: 'voyager',
    icon: '📷',
    ctaMonthly: 'Unlock Voyager · £4.99',
    ctaAnnual: '£4.99 one-time (lifetime)',
    priceMonthly: '£4.99',
    priceAnnual: '£4.99 lifetime',
  },
  offline_packs: {
    headline: "Go truly offline",
    featureName: "Offline Language Packs",
    body: "Download full language packs — phrasebook, audio, and translation — for use without internet.",
    bullets: ["Full phrasebook offline", "Audio pronunciation offline", "40+ languages available"],
    requiredTier: 'voyager',
    icon: '⬇️',
    ctaMonthly: 'Unlock Voyager · £4.99',
    ctaAnnual: '£4.99 one-time (lifetime)',
    priceMonthly: '£4.99',
    priceAnnual: '£4.99 lifetime',
  },
  drag_reorder: {
    headline: "Own your day",
    featureName: "Reorder Tasks",
    body: "Drag and drop to rearrange your daily itinerary exactly how you want it.",
    bullets: ["Drag-to-reorder tasks", "Custom task creation", "Move tasks between days"],
    requiredTier: 'voyager',
    icon: '✋',
    ctaMonthly: 'Unlock Voyager · £4.99',
    ctaAnnual: '£4.99 one-time (lifetime)',
    priceMonthly: '£4.99',
    priceAnnual: '£4.99 lifetime',
  },
  social_intelligence: {
    headline: "See who's been here",
    featureName: "Social Intelligence",
    body: "Real influencer picks, trend scores, and celebrity recommendations — updated in real time.",
    bullets: ["Live influencer feed", "Trend scores (0-100)", "Celebrity picks", "Real-time updates"],
    requiredTier: 'nomad_pro',
    icon: '🔥',
    ctaMonthly: 'Start Nomad Pro · £2.99/mo',
    ctaAnnual: '£24.99/year (save 30%)',
    priceMonthly: '£2.99/month',
    priceAnnual: '£24.99/year',
  },
  ai_assistant: {
    headline: "Your AI travel companion",
    featureName: "AI Trip Assistant",
    body: "Ask anything, replan on the fly, get budget advice — your personal AI that knows your entire trip.",
    bullets: ["Chat with your itinerary", "Real-time replanning", "Budget intelligence", "Venue recommendations"],
    requiredTier: 'nomad_pro',
    icon: '🤖',
    ctaMonthly: 'Start Nomad Pro · £2.99/mo',
    ctaAnnual: '£24.99/year (save 30%)',
    priceMonthly: '£2.99/month',
    priceAnnual: '£24.99/year',
  },
  realtime_disruptions: {
    headline: "Stay ahead of disruptions",
    featureName: "Live Transport Alerts",
    body: "Get real-time disruption alerts for your routes before they ruin your plans.",
    bullets: ["Live transport disruptions", "Push notifications", "Route alternatives suggested"],
    requiredTier: 'nomad_pro',
    icon: '🚨',
    ctaMonthly: 'Start Nomad Pro · £2.99/mo',
    ctaAnnual: '£24.99/year (save 30%)',
    priceMonthly: '£2.99/month',
    priceAnnual: '£24.99/year',
  },
  export: {
    headline: "Take it anywhere",
    featureName: "Export Trip",
    body: "Export your itinerary as a beautiful PDF to share with travel companions or print for the trip.",
    bullets: ["PDF export", "Share with anyone", "Trip summary included"],
    requiredTier: 'voyager',
    icon: '📤',
    ctaMonthly: 'Unlock Voyager · £4.99',
    ctaAnnual: '£4.99 one-time (lifetime)',
    priceMonthly: '£4.99',
    priceAnnual: '£4.99 lifetime',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export interface UpsellModalProps {
  visible: boolean;
  feature: UpsellFeature | null;
  onUpgrade: (tier: UserTier, annual: boolean) => void;
  onDismiss: () => void;
}

export function UpsellModal({
  visible,
  feature,
  onUpgrade,
  onDismiss,
}: UpsellModalProps): React.ReactElement | null {
  const { theme } = useTheme();

  if (!feature) return null;

  const content = UPSELL_CONTENT[feature];
  const isPro = content.requiredTier === 'nomad_pro';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <View style={styles.backdropInner} />
      </Pressable>

      <View
        style={[
          styles.sheet,
          {
            backgroundColor: theme.bg_surface,
            borderColor: theme.border_default,
          },
        ]}
        accessibilityViewIsModal
        accessibilityLabel={`Upgrade to ${content.requiredTier === 'nomad_pro' ? 'Nomad Pro' : 'Voyager'}`}
      >
        {/* Close button */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={20} color={theme.text_secondary} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Icon */}
          <Text style={styles.icon}>{content.icon}</Text>

          {/* Headline */}
          <Text
            style={[
              styles.headline,
              { fontFamily: theme.font_display, color: theme.text_primary },
            ]}
          >
            {content.headline}
          </Text>

          <Text
            style={[
              styles.featureName,
              { fontFamily: theme.font_serif, color: theme.text_secondary },
            ]}
          >
            {content.featureName}
          </Text>

          <Text
            style={[
              styles.body,
              { fontFamily: theme.font_body, color: theme.text_secondary },
            ]}
          >
            {content.body}
          </Text>

          {/* Bullets */}
          <View
            style={[
              styles.bulletsContainer,
              {
                backgroundColor: theme.bg_raised,
                borderRadius: theme.radius_md,
              },
            ]}
          >
            {content.bullets.map((bullet) => (
              <View key={bullet} style={styles.bulletRow}>
                <Check
                  size={14}
                  color={theme.system_success}
                  strokeWidth={2.5}
                />
                <Text
                  style={[
                    styles.bulletText,
                    { fontFamily: theme.font_body, color: theme.text_primary },
                  ]}
                >
                  {bullet}
                </Text>
              </View>
            ))}
          </View>

          {/* CTAs */}
          <Button
            label={content.ctaMonthly}
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => onUpgrade(content.requiredTier, false)}
            style={styles.ctaPrimary}
          />

          {isPro ? (
            <Button
              label={content.ctaAnnual}
              variant="outline"
              size="lg"
              fullWidth
              onPress={() => onUpgrade(content.requiredTier, true)}
            />
          ) : null}

          <Text
            style={[
              styles.trustText,
              { fontFamily: theme.font_body, color: theme.text_disabled },
            ]}
          >
            {isPro ? 'No commitment. Cancel anytime.' : 'One-time payment. No subscription.'}
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  backdropInner: {
    flex: 1,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    maxHeight: '85%',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 24,
    paddingTop: 32,
    gap: 16,
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
    textAlign: 'center',
  },
  headline: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 32,
  },
  featureName: {
    fontSize: 17,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  bulletsContainer: {
    width: '100%',
    padding: 16,
    gap: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bulletText: {
    fontSize: 15,
    flex: 1,
  },
  ctaPrimary: {
    marginTop: 8,
  },
  trustText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});
