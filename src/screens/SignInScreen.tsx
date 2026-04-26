// ─────────────────────────────────────────────────────────────────────────────
// SIGN IN SCREEN (Items 18-21)
// iOS:     Apple → Google → Email OTP
// Android: Google → Email OTP
// Explore Without Signing In ghost button
// Links to Terms and Privacy at bottom
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { createClient } from '@supabase/supabase-js';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '@theme/useTheme';
import { FONT_FAMILIES } from '@theme/fonts';
import { Input } from '@components/shared/Input';
import { Button } from '@components/shared/Button';
import { LIKBadge } from '@components/shared/LIKBadge';
import { useUserStore } from '@stores/userStore';
import type { RootStackParamList } from '@/types';

// ─── Supabase client ──────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL as string,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string,
);

type Props = NativeStackScreenProps<RootStackParamList, 'SignIn'>;

type AuthStep = 'buttons' | 'otp-email' | 'otp-verify';

export function SignInScreen({ navigation }: Props): React.ReactElement {
  const { theme } = useTheme();
  const { setUser, setAuthTokens } = useUserStore();

  const [step, setStep] = useState<AuthStep>('buttons');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Email OTP — send ──────────────────────────────────────────────────────

  const handleSendOTP = useCallback(async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('Please enter your email address.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { shouldCreateUser: true },
      });
      if (authError) throw authError;
      setStep('otp-verify');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send code.');
    } finally {
      setLoading(false);
    }
  }, [email]);

  // ── Email OTP — verify ────────────────────────────────────────────────────

  const handleVerifyOTP = useCallback(async () => {
    if (otp.trim().length < 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otp.trim(),
        type: 'email',
      });
      if (authError) throw authError;
      if (data.session) {
        setAuthTokens({
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresAt: data.session.expires_at ?? 0,
        });
      }
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email ?? '',
          displayName: data.user.user_metadata?.full_name ?? null,
          avatarUrl: data.user.user_metadata?.avatar_url ?? null,
          tier: 'explorer',
          homeCurrency: 'GBP',
          languages: [],
          profileSetupDone: false,
          theme: 'bubbly',
          categoryColours: null,
          totalTrips: 0,
          totalDays: 0,
          totalTasksCompleted: 0,
          countriesVisited: [],
        });
      }
      navigation.replace('ProfileSetup');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [email, otp, navigation, setAuthTokens, setUser]);

  // ── Google sign-in ────────────────────────────────────────────────────────

  const handleGoogleSignIn = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (authError) throw authError;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
      setLoading(false);
    }
  }, []);

  // ── Apple sign-in (iOS only) ───────────────────────────────────────────────

  const handleAppleSignIn = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
      });
      if (authError) throw authError;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Apple sign-in failed.');
      setLoading(false);
    }
  }, []);

  // ── Explore without signing in ────────────────────────────────────────────

  const handleExplore = useCallback(() => {
    navigation.replace('Main');
  }, [navigation]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: theme.bg_primary }]}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            {/* Hero */}
            <View style={styles.hero}>
              <LIKBadge size="splash" style={styles.badge} />
              <View style={styles.wordmark}>
                <Text style={[styles.wordmarkEasy, { fontFamily: FONT_FAMILIES.fredokaBold, color: theme.text_primary }]}>
                  Easy
                </Text>
                <Text style={[styles.wordmarkTrip, { fontFamily: FONT_FAMILIES.fredokaBold, color: theme.brand_gold ?? '#FFD93D' }]}>
                  Trip
                </Text>
              </View>
              <Text style={[styles.tagline, { fontFamily: FONT_FAMILIES.nunitoSemiBold, color: theme.text_secondary }]}>
                Plan smarter. Travel better.
              </Text>
            </View>

            {/* Error */}
            {error ? (
              <View style={[styles.errorBox, { backgroundColor: `${theme.system_error}18`, borderColor: theme.system_error }]}>
                <Text style={[styles.errorText, { fontFamily: FONT_FAMILIES.nunitoSemiBold, color: theme.system_error }]}>
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Step: buttons */}
            {step === 'buttons' && (
              <View style={styles.authButtons}>
                {/* Apple (iOS only) */}
                {Platform.OS === 'ios' && (
                  <SocialButton
                    emoji="🍎"
                    label="Continue with Apple"
                    onPress={handleAppleSignIn}
                    theme={theme}
                    loading={loading}
                    bg={theme.text_primary}
                    textColor={theme.text_inverse}
                  />
                )}

                {/* Google */}
                <SocialButton
                  emoji="🔵"
                  label="Continue with Google"
                  onPress={handleGoogleSignIn}
                  theme={theme}
                  loading={loading}
                  bg={theme.bg_surface}
                  textColor={theme.text_primary}
                />

                {/* Email OTP */}
                <SocialButton
                  emoji="✉️"
                  label="Continue with Email"
                  onPress={() => setStep('otp-email')}
                  theme={theme}
                  loading={false}
                  bg={theme.bg_surface}
                  textColor={theme.text_primary}
                />

                <View style={styles.divider}>
                  <View style={[styles.dividerLine, { backgroundColor: theme.border_default }]} />
                </View>

                {/* Explore without signing in */}
                <Button
                  label="Explore Without Signing In"
                  variant="ghost"
                  onPress={handleExplore}
                />
              </View>
            )}

            {/* Step: enter email for OTP */}
            {step === 'otp-email' && (
              <View style={styles.form}>
                <Text style={[styles.formTitle, { fontFamily: FONT_FAMILIES.fredokaBold, color: theme.text_primary }]}>
                  What's your email?
                </Text>
                <Input
                  label="Email address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="you@example.com"
                  fontVariant="nunito"
                  returnKeyType="send"
                  onSubmitEditing={handleSendOTP}
                />
                <Button
                  label={loading ? 'Sending…' : 'Send Code'}
                  variant="primary"
                  disabled={loading}
                  onPress={handleSendOTP}
                />
                <Button label="Back" variant="ghost" onPress={() => { setStep('buttons'); setError(null); }} />
              </View>
            )}

            {/* Step: verify OTP */}
            {step === 'otp-verify' && (
              <View style={styles.form}>
                <Text style={[styles.formTitle, { fontFamily: FONT_FAMILIES.fredokaBold, color: theme.text_primary }]}>
                  Check your inbox 📬
                </Text>
                <Text style={[styles.otpHint, { fontFamily: FONT_FAMILIES.nunitoSemiBold, color: theme.text_secondary }]}>
                  We sent a 6-digit code to {email}
                </Text>
                <Input
                  label="6-digit code"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="123456"
                  fontVariant="fredoka"
                  returnKeyType="done"
                  onSubmitEditing={handleVerifyOTP}
                />
                <Button
                  label={loading ? 'Verifying…' : 'Verify Code'}
                  variant="primary"
                  disabled={loading}
                  onPress={handleVerifyOTP}
                />
                <Button
                  label="Resend code"
                  variant="ghost"
                  onPress={handleSendOTP}
                  disabled={loading}
                />
                <Button label="Back" variant="ghost" onPress={() => { setStep('otp-email'); setError(null); }} />
              </View>
            )}

            {/* Legal links */}
            <View style={styles.legal}>
              <Text style={[styles.legalText, { fontFamily: FONT_FAMILIES.nunitoSemiBold, color: theme.text_disabled }]}>
                By continuing you agree to our{' '}
                <Text style={{ color: theme.interactive_primary }}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={{ color: theme.interactive_primary }}>Privacy Policy</Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {loading && step === 'buttons' && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={theme.interactive_primary} />
        </View>
      )}
    </View>
  );
}

// ─── Social button ────────────────────────────────────────────────────────────

interface SocialButtonProps {
  emoji: string;
  label: string;
  onPress: () => void;
  theme: ReturnType<typeof useTheme>['theme'];
  loading?: boolean;
  bg: string;
  textColor: string;
}

function SocialButton({ emoji, label, onPress, theme, loading, bg, textColor }: SocialButtonProps): React.ReactElement {
  return (
    <TouchableOpacity
      style={[
        styles.socialBtn,
        {
          backgroundColor: bg,
          borderColor: theme.text_primary,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={loading}
    >
      <Text style={styles.socialEmoji}>{emoji}</Text>
      <Text style={[styles.socialLabel, { color: textColor, fontFamily: FONT_FAMILIES.nunitoBold }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  hero: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 32,
    gap: 12,
  },
  badge: { marginBottom: 8 },
  wordmark: { flexDirection: 'row', alignItems: 'center' },
  wordmarkEasy: { fontSize: 36 },
  wordmarkTrip: { fontSize: 36 },
  tagline: { fontSize: 15 },
  errorBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { fontSize: 13, lineHeight: 20 },
  authButtons: { gap: 12 },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 54,
    borderRadius: 14,
    borderWidth: 3,
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 0,
    elevation: 4,
  },
  socialEmoji: { fontSize: 20 },
  socialLabel: { fontSize: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1 },
  form: { gap: 14 },
  formTitle: { fontSize: 26, marginBottom: 4 },
  otpHint: { fontSize: 14, lineHeight: 22, marginBottom: 4 },
  legal: { marginTop: 32, alignItems: 'center', paddingHorizontal: 12 },
  legalText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
