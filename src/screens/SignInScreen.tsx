// ─────────────────────────────────────────────────────────────────────────────
// EASYTRIP — SIGN IN SCREEN
// Email/password + Google + Apple sign-in via Supabase Auth.
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
import { TextInput } from '@components/atoms/TextInput';
import { Button } from '@components/atoms/Button';
import { useUserStore } from '@stores/userStore';
import { userApi } from '@services/apiClient';
import type { RootStackParamList } from '@/types';

// ─── Supabase client ──────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL as string,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string,
);

// ─── Types ────────────────────────────────────────────────────────────────────
type Props = NativeStackScreenProps<RootStackParamList, 'SignIn'>;

// ─── Component ────────────────────────────────────────────────────────────────

export function SignInScreen({ navigation }: Props): React.ReactElement {
  const { theme } = useTheme();
  const { setUser, setAuthTokens } = useUserStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Email/password sign-in ─────────────────────────────────────────────────

  const handleEmailSignIn = useCallback(async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (authError) throw new Error(authError.message);
      if (!data.session) throw new Error('No session returned');

      const { access_token, refresh_token } = data.session;
      setAuthTokens(access_token, refresh_token);

      // Fetch full profile from our API
      const profile = await userApi.getProfile();
      setUser(profile);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [email, password, setUser, setAuthTokens]);

  // ── Google OAuth ──────────────────────────────────────────────────────────

  const handleGoogleSignIn = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'easytrip://auth/callback',
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
      if (authError) throw new Error(authError.message);
      // OAuth flow opens a browser — session is picked up via deep link handler in App.tsx
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Apple OAuth ───────────────────────────────────────────────────────────

  const handleAppleSignIn = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo: 'easytrip://auth/callback' },
      });
      if (authError) throw new Error(authError.message);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Apple sign-in failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Forgot password ───────────────────────────────────────────────────────

  const handleForgotPassword = useCallback(async () => {
    if (!email.trim()) {
      Alert.alert('Reset Password', 'Enter your email address above, then tap Forgot Password.');
      return;
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: 'easytrip://auth/reset-password' },
    );
    if (resetError) {
      Alert.alert('Error', resetError.message);
    } else {
      Alert.alert('Check your email', 'We sent you a password reset link.');
    }
  }, [email]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: theme.bg_primary }]}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo / Hero */}
            <View style={styles.hero}>
              <LinearGradient
                colors={[`${theme.brand_lime}30`, 'transparent']}
                style={styles.heroBg}
              />
              <View style={[styles.logoCircle, { backgroundColor: theme.brand_lime }]}>
                <Text style={styles.logoEmoji}>✈️</Text>
              </View>
              <Text style={[styles.appName, { color: theme.text_primary, fontFamily: theme.font_display }]}>
                EasyTrip
              </Text>
              <Text style={[styles.tagline, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                Your AI-powered travel companion
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Text style={[styles.formTitle, { color: theme.text_primary, fontFamily: theme.font_display }]}>
                Welcome back
              </Text>

              {error ? (
                <View style={[styles.errorBox, { backgroundColor: `${theme.system_error}20`, borderColor: theme.system_error }]}>
                  <Text style={[styles.errorText, { color: theme.system_error, fontFamily: theme.font_body }]}>
                    {error}
                  </Text>
                </View>
              ) : null}

              <TextInput
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />

              <TextInput
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleEmailSignIn}
              />

              <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn}>
                <Text style={[styles.forgotText, { color: theme.brand_cyan, fontFamily: theme.font_body }]}>
                  Forgot password?
                </Text>
              </TouchableOpacity>

              <Button
                label={loading ? 'Signing in…' : 'Sign In'}
                variant="primary"
                size="lg"
                fullWidth
                disabled={loading}
                onPress={handleEmailSignIn}
              />

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: theme.border_default }]} />
                <Text style={[styles.dividerText, { color: theme.text_disabled, fontFamily: theme.font_body }]}>
                  or continue with
                </Text>
                <View style={[styles.dividerLine, { backgroundColor: theme.border_default }]} />
              </View>

              {/* Social sign-in */}
              <View style={styles.socialRow}>
                <TouchableOpacity
                  style={[styles.socialBtn, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}
                  onPress={handleGoogleSignIn}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.socialIcon}>🌐</Text>
                  <Text style={[styles.socialLabel, { color: theme.text_primary, fontFamily: theme.font_body_medium }]}>
                    Google
                  </Text>
                </TouchableOpacity>

                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={[styles.socialBtn, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}
                    onPress={handleAppleSignIn}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.socialIcon}></Text>
                    <Text style={[styles.socialLabel, { color: theme.text_primary, fontFamily: theme.font_body_medium }]}>
                      Apple
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Sign up link */}
              <View style={styles.signupRow}>
                <Text style={[styles.signupText, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                  Don't have an account?{' '}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                  <Text style={[styles.signupLink, { color: theme.brand_lime, fontFamily: theme.font_body_medium }]}>
                    Sign up free
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Full-screen loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.brand_lime} />
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },
  hero: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 32,
    overflow: 'hidden',
  },
  heroBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoEmoji: { fontSize: 36 },
  appName: { fontSize: 32, fontWeight: '800', marginBottom: 6 },
  tagline: { fontSize: 15 },
  form: { gap: 16, paddingBottom: 40 },
  formTitle: { fontSize: 26, fontWeight: '700', marginBottom: 4 },
  errorBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  errorText: { fontSize: 13, lineHeight: 18 },
  forgotBtn: { alignSelf: 'flex-end', marginTop: -4 },
  forgotText: { fontSize: 13 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12 },
  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
  },
  socialIcon: { fontSize: 18 },
  socialLabel: { fontSize: 14 },
  signupRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signupText: { fontSize: 14 },
  signupLink: { fontSize: 14 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
