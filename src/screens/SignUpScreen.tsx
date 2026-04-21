// ─────────────────────────────────────────────────────────────────────────────
// EASYTRIP — SIGN UP SCREEN
// Email/password registration + Google/Apple social sign-up via Supabase Auth.
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(pw)) return 'Password must contain at least one uppercase letter.';
  if (!/[0-9]/.test(pw)) return 'Password must contain at least one number.';
  return null;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

// ─── Component ────────────────────────────────────────────────────────────────

export function SignUpScreen({ navigation }: Props): React.ReactElement {
  const { theme } = useTheme();
  const { setUser, setAuthTokens } = useUserStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Email/password registration ───────────────────────────────────────────

  const handleEmailSignUp = useCallback(async () => {
    setError(null);

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!validateEmail(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    const pwError = validatePassword(password);
    if (pwError) {
      setError(pwError);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { display_name: name.trim() },
          emailRedirectTo: 'easytrip://auth/callback',
        },
      });

      if (authError) throw new Error(authError.message);

      // If Supabase email confirmation is enabled, session is null until confirmed
      if (data.session) {
        const { access_token, refresh_token } = data.session;
        setAuthTokens(access_token, refresh_token);
        const profile = await userApi.getProfile();
        setUser(profile);
      } else {
        // Email confirmation required
        Alert.alert(
          'Check your inbox',
          'We sent you a confirmation email. Click the link to activate your account.',
          [{ text: 'OK', onPress: () => navigation.navigate('SignIn') }],
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign up failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [name, email, password, confirmPassword, setUser, setAuthTokens, navigation]);

  // ── Google OAuth ──────────────────────────────────────────────────────────

  const handleGoogleSignUp = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'easytrip://auth/callback',
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
      if (authError) throw new Error(authError.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-up failed.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Apple OAuth ───────────────────────────────────────────────────────────

  const handleAppleSignUp = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo: 'easytrip://auth/callback' },
      });
      if (authError) throw new Error(authError.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Apple sign-up failed.');
    } finally {
      setLoading(false);
    }
  }, []);

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
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Text style={[styles.backText, { color: theme.text_secondary }]}>← Back</Text>
              </TouchableOpacity>
            </View>

            {/* Hero */}
            <View style={styles.hero}>
              <LinearGradient
                colors={[`${theme.brand_cyan}25`, 'transparent']}
                style={styles.heroBg}
              />
              <Text style={[styles.heroTitle, { color: theme.text_primary, fontFamily: theme.font_display }]}>
                Create your account ✨
              </Text>
              <Text style={[styles.heroSubtitle, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                Plan smarter. Travel better. Start free.
              </Text>
            </View>

            {/* Social sign-up (above form — prioritise for friction) */}
            <View style={styles.socialRow}>
              <TouchableOpacity
                style={[styles.socialBtn, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}
                onPress={handleGoogleSignUp}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.socialIcon}>🌐</Text>
                <Text style={[styles.socialLabel, { color: theme.text_primary, fontFamily: theme.font_body_medium }]}>
                  Continue with Google
                </Text>
              </TouchableOpacity>

              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={[styles.socialBtn, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}
                  onPress={handleAppleSignUp}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.socialIcon}></Text>
                  <Text style={[styles.socialLabel, { color: theme.text_primary, fontFamily: theme.font_body_medium }]}>
                    Continue with Apple
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border_default }]} />
              <Text style={[styles.dividerText, { color: theme.text_disabled, fontFamily: theme.font_body }]}>
                or sign up with email
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.border_default }]} />
            </View>

            {/* Form */}
            <View style={styles.form}>
              {error ? (
                <View style={[styles.errorBox, { backgroundColor: `${theme.system_error}20`, borderColor: theme.system_error }]}>
                  <Text style={[styles.errorText, { color: theme.system_error, fontFamily: theme.font_body }]}>
                    {error}
                  </Text>
                </View>
              ) : null}

              <TextInput
                label="Full name"
                placeholder="Jane Smith"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
              />

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
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="next"
              />

              <TextInput
                label="Confirm password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleEmailSignUp}
              />

              {/* Password strength indicator */}
              {password.length > 0 && (
                <View style={styles.strengthRow}>
                  {[
                    password.length >= 8,
                    /[A-Z]/.test(password),
                    /[0-9]/.test(password),
                  ].map((met, i) => (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,
                        { backgroundColor: met ? theme.system_success : theme.bg_raised },
                      ]}
                    />
                  ))}
                  <Text style={[styles.strengthLabel, { color: theme.text_disabled, fontFamily: theme.font_body }]}>
                    {password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)
                      ? 'Strong'
                      : 'Weak'}
                  </Text>
                </View>
              )}

              <Button
                label={loading ? 'Creating account…' : 'Create Account'}
                variant="primary"
                size="lg"
                fullWidth
                disabled={loading}
                onPress={handleEmailSignUp}
              />

              {/* Terms */}
              <Text style={[styles.terms, { color: theme.text_disabled, fontFamily: theme.font_body }]}>
                By creating an account you agree to our{' '}
                <Text style={{ color: theme.brand_cyan }}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={{ color: theme.brand_cyan }}>Privacy Policy</Text>.
              </Text>

              {/* Sign in link */}
              <View style={styles.signInRow}>
                <Text style={[styles.signInText, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                  Already have an account?{' '}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                  <Text style={[styles.signInLink, { color: theme.brand_lime, fontFamily: theme.font_body_medium }]}>
                    Sign in
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

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
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  header: { paddingTop: 8, paddingBottom: 8 },
  backBtn: {},
  backText: { fontSize: 15 },
  hero: {
    paddingTop: 16,
    paddingBottom: 28,
    overflow: 'hidden',
  },
  heroBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  heroTitle: { fontSize: 28, fontWeight: '800', marginBottom: 6 },
  heroSubtitle: { fontSize: 15 },
  socialRow: { gap: 10, marginBottom: 8 },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
  },
  socialIcon: { fontSize: 20 },
  socialLabel: { fontSize: 15 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 16,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12 },
  form: { gap: 14 },
  errorBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  errorText: { fontSize: 13, lineHeight: 18 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, width: 36, textAlign: 'right' },
  terms: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
  signInRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signInText: { fontSize: 14 },
  signInLink: { fontSize: 14 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
