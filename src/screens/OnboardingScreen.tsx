import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@theme/useTheme';
import { Button } from '@components/atoms/Button';

const { width, height } = Dimensions.get('window');

const TAGLINES = [
  'Plan smarter trips',
  'Discover hidden gems',
  'Travel with confidence',
];

export function OnboardingScreen(): React.ReactElement {
  const { theme } = useTheme();

  // Logo animation
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);
  const buttonsTranslate = useSharedValue(30);

  const [taglineIndex, setTaglineIndex] = React.useState(0);

  useEffect(() => {
    // Logo enters
    logoScale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 100 }));
    logoOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    // Tagline fades
    taglineOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));
    // Buttons slide up
    buttonsOpacity.value = withDelay(1200, withTiming(1, { duration: 500 }));
    buttonsTranslate.value = withDelay(1200, withSpring(0, { damping: 14 }));

    // Cycle taglines
    const interval = setInterval(() => {
      taglineOpacity.value = withSequence(
        withTiming(0, { duration: 300 }),
        withTiming(1, { duration: 300 })
      );
      setTaglineIndex((i) => (i + 1) % TAGLINES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));

  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsTranslate.value }],
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.bg_primary, theme.gradient_hero[0], theme.gradient_hero[1]]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Stars / grain overlay */}
      <View style={[styles.grain, { opacity: theme.grain_opacity }]}>
        {Array.from({ length: 40 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.star,
              {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 60}%`,
                backgroundColor: theme.text_primary,
                opacity: Math.random() * 0.4 + 0.1,
                width: Math.random() * 3 + 1,
                height: Math.random() * 3 + 1,
              },
            ]}
          />
        ))}
      </View>

      <SafeAreaView style={styles.safe}>
        <View style={styles.logoSection}>
          <Animated.View style={[styles.logoWrapper, logoStyle]}>
            {/* Logo placeholder — replace with actual SVG/image */}
            <View style={[styles.logoCircle, { backgroundColor: theme.brand_lime }]}>
              <Text style={[styles.logoEmoji]}>✈️</Text>
            </View>
            <View style={[styles.logoGlow, { backgroundColor: theme.brand_lime }]} />
          </Animated.View>

          <Animated.View style={[styles.brandTextWrapper, logoStyle]}>
            <Text style={[styles.brandName, { color: theme.text_primary, fontFamily: theme.font_display }]}>
              EasyTrip
            </Text>
          </Animated.View>

          <Animated.View style={taglineStyle}>
            <Text style={[styles.tagline, { color: theme.brand_lime, fontFamily: theme.font_body }]}>
              {TAGLINES[taglineIndex]}
            </Text>
          </Animated.View>
        </View>

        <Animated.View style={[styles.buttonsSection, buttonsStyle]}>
          {/* Google Sign In */}
          <TouchableOpacity
            style={[
              styles.socialButton,
              { backgroundColor: theme.bg_surface, borderColor: theme.border_default },
            ]}
            activeOpacity={0.85}
          >
            <Text style={styles.socialIcon}>🔵</Text>
            <Text style={[styles.socialLabel, { color: theme.text_primary, fontFamily: theme.font_body_medium }]}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          {/* Apple Sign In */}
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[
                styles.socialButton,
                { backgroundColor: theme.bg_surface, borderColor: theme.border_default },
              ]}
              activeOpacity={0.85}
            >
              <Text style={styles.socialIcon}>🍎</Text>
              <Text style={[styles.socialLabel, { color: theme.text_primary, fontFamily: theme.font_body_medium }]}>
                Continue with Apple
              </Text>
            </TouchableOpacity>
          )}

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: theme.border_default }]} />
            <Text style={[styles.dividerText, { color: theme.text_disabled, fontFamily: theme.font_body }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.border_default }]} />
          </View>

          <Button
            label="Get Started Free"
            variant="primary"
            size="lg"
            fullWidth
          />

          <Text style={[styles.legalText, { color: theme.text_disabled, fontFamily: theme.font_body }]}>
            By continuing, you agree to our{' '}
            <Text style={{ color: theme.brand_cyan }}>Terms</Text>
            {' '}and{' '}
            <Text style={{ color: theme.brand_cyan }}>Privacy Policy</Text>
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 24 },
  grain: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  star: { position: 'absolute', borderRadius: 999 },
  logoSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: { fontSize: 44 },
  logoGlow: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 28,
    opacity: 0.25,
    transform: [{ scale: 1.5 }],
  },
  brandTextWrapper: {},
  brandName: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.9,
  },
  buttonsSection: {
    paddingBottom: 32,
    gap: 12,
  },
  socialButton: {
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  socialIcon: { fontSize: 20 },
  socialLabel: { fontSize: 16 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },
  legalText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});
