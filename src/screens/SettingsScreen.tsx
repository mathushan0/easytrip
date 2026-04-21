import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/useTheme';
import { useUserStore } from '@stores/userStore';
import { UpsellModal } from '@components/molecules/UpsellModal';
import { Divider } from '@components/atoms/Divider';
import type { ThemeName, CategoryKey, UserTier } from '@/types';

// ─── Types ─────────────────────────────────────────────────────────────────────

type UpsellFeature =
  | 'themes'
  | 'offline_packs'
  | 'camera_translate'
  | 'drag_reorder'
  | 'social_intelligence'
  | 'ai_assistant'
  | 'realtime_disruptions'
  | 'export'
  | 'unlimited_trips'
  | 'trip_duration';

// ─── Theme option config ────────────────────────────────────────────────────

interface ThemeOption {
  name: ThemeName;
  label: string;
  description: string;
  previewBg: string;
  previewAccent: string;
  isPaid: boolean;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    name: 'dark_light',
    label: 'Dark Mode',
    description: 'Clean zinc dark — free tier',
    previewBg: '#18181B',
    previewAccent: '#6366F1',
    isPaid: false,
  },
  {
    name: 'aurora_dark',
    label: 'Aurora Dark',
    description: 'Northern lights · deep space',
    previewBg: '#0f1219',
    previewAccent: '#38e8d8',
    isPaid: true,
  },
  {
    name: 'warm_sand',
    label: 'Warm Sand',
    description: 'Editorial · travel journal',
    previewBg: '#EDE8DC',
    previewAccent: '#C9613E',
    isPaid: true,
  },
  {
    name: 'electric',
    label: 'Electric',
    description: 'Cyberpunk · neon grid',
    previewBg: '#0F0F0F',
    previewAccent: '#C6FF00',
    isPaid: true,
  },
];

// ─── Category colours ───────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  food: '🍜 Food & Dining',
  landmark: '📍 Landmarks',
  transport: '🚆 Transport',
  culture: '🎭 Culture & Arts',
  budget: '💰 Budget',
  accommodation: '🏨 Accommodation',
  general: '📌 General',
};

const CATEGORY_PRESET_PALETTES: Record<CategoryKey, string[]> = {
  food: ['#38e8d8', '#FF6B6B', '#FFA94D', '#69DB7C'],
  landmark: ['#9b6fff', '#748FFC', '#F783AC', '#4DABF7'],
  transport: ['#f5c842', '#FFA94D', '#FF8787', '#74C0FC'],
  culture: ['#9b6fff', '#E599F7', '#748FFC', '#63E6BE'],
  budget: ['#ff5f5f', '#FFA94D', '#63E6BE', '#74C0FC'],
  accommodation: ['#f5c842', '#63E6BE', '#748FFC', '#F783AC'],
  general: ['#8892B0', '#A9B4D0', '#74C0FC', '#B2F2BB'],
};

// ─── Language options ──────────────────────────────────────────────────────

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
  { code: 'ko', label: '한국어' },
  { code: 'ar', label: 'العربية' },
];

// ─── Currency options ──────────────────────────────────────────────────────

const CURRENCIES = ['GBP', 'USD', 'EUR', 'JPY', 'AUD', 'CAD', 'CHF', 'SGD', 'HKD', 'NZD'];

// ─── Section header ────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }): React.ReactElement {
  const { theme } = useTheme();
  return (
    <Text
      style={[
        styles.sectionHeader,
        { fontFamily: theme.font_body_medium, color: theme.text_secondary },
      ]}
    >
      {label.toUpperCase()}
    </Text>
  );
}

// ─── Setting row ───────────────────────────────────────────────────────────

interface SettingRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  destructive?: boolean;
}

function SettingRow({ label, value, onPress, right, destructive }: SettingRowProps): React.ReactElement {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.settingRow, { borderBottomColor: theme.border_default }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress && !right}
    >
      <Text
        style={[
          styles.settingLabel,
          {
            fontFamily: theme.font_body,
            color: destructive ? theme.system_error : theme.text_primary,
          },
        ]}
      >
        {label}
      </Text>
      {right ?? (
        value ? (
          <Text style={[styles.settingValue, { fontFamily: theme.font_body, color: theme.text_secondary }]}>
            {value}
          </Text>
        ) : null
      )}
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────

export function SettingsScreen(): React.ReactElement {
  const { theme, themeName, setTheme, setCategoryColour, resolvedCategoryColour } = useTheme();
  const { user, entitlements, updateUser } = useUserStore();

  const [upsellVisible, setUpsellVisible] = useState(false);
  const [upsellFeature, setUpsellFeature] = useState<UpsellFeature>('themes');

  const [notifyTripReminders, setNotifyTripReminders] = useState(true);
  const [notifyGenerationDone, setNotifyGenerationDone] = useState(true);
  const [notifySocialUpdates, setNotifySocialUpdates] = useState(false);
  const [notifyDisruptions, setNotifyDisruptions] = useState(true);

  function trySetTheme(name: ThemeName): void {
    if (name !== 'dark_light' && !entitlements.hasThemes) {
      setUpsellFeature('themes');
      setUpsellVisible(true);
      return;
    }
    setTheme(name);
    updateUser({ theme: name });
  }

  function handleSelectLanguage(): void {
    Alert.alert(
      'Language',
      'Select your preferred language',
      LANGUAGES.map((lang) => ({
        text: lang.label,
        onPress: () => updateUser({ preferredLanguage: lang.code }),
      })),
      { cancelable: true },
    );
  }

  function handleSelectCurrency(): void {
    Alert.alert(
      'Currency',
      'Select your display currency',
      CURRENCIES.map((c) => ({
        text: c,
        onPress: () => updateUser({ preferredCurrency: c }),
      })),
      { cancelable: true },
    );
  }

  function handleCategoryColourPress(category: CategoryKey): void {
    if (!entitlements.hasThemes) {
      setUpsellFeature('themes');
      setUpsellVisible(true);
      return;
    }
    const palette = CATEGORY_PRESET_PALETTES[category];
    Alert.alert(
      `${CATEGORY_LABELS[category]} colour`,
      'Choose a colour',
      palette.map((hex) => ({
        text: hex,
        onPress: () => setCategoryColour(category, hex),
      })),
      { cancelable: true },
    );
  }

  function handleClearOfflineData(): void {
    Alert.alert(
      'Clear Offline Data',
      'This will remove all downloaded language packs and cached maps. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => {} },
      ],
    );
  }

  function handleSignOut(): void {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => useUserStore.getState().clearAuth() },
    ]);
  }

  const currentLanguage =
    LANGUAGES.find((l) => l.code === (user?.preferredLanguage ?? 'en'))?.label ?? 'English';
  const currentCurrency = user?.preferredCurrency ?? 'GBP';

  return (
    <View style={[styles.container, { backgroundColor: theme.bg_primary }]}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border_default }]}>
          <Text style={[styles.title, { fontFamily: theme.font_display, color: theme.text_primary }]}>
            Settings
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── APPEARANCE ──────────────────────────────────────────── */}
          <SectionHeader label="Appearance" />

          <View style={[styles.card, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}>
            <Text style={[styles.cardLabel, { fontFamily: theme.font_body_medium, color: theme.text_secondary }]}>
              Theme
            </Text>
            <View style={styles.themeGrid}>
              {THEME_OPTIONS.map((opt) => {
                const isSelected = themeName === opt.name;
                const isLocked = opt.isPaid && !entitlements.hasThemes;
                return (
                  <TouchableOpacity
                    key={opt.name}
                    style={[
                      styles.themeChip,
                      {
                        backgroundColor: opt.previewBg,
                        borderColor: isSelected ? theme.interactive_primary : theme.border_default,
                        borderWidth: isSelected ? 2 : 1,
                        opacity: isLocked ? 0.7 : 1,
                      },
                    ]}
                    onPress={() => trySetTheme(opt.name)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    accessibilityLabel={opt.label}
                  >
                    <View style={[styles.themeAccentDot, { backgroundColor: opt.previewAccent }]} />
                    <Text style={[styles.themeChipLabel, { color: opt.isPaid ? '#fff' : '#fff' }]}>
                      {opt.label}
                    </Text>
                    {isLocked ? <Text style={styles.lockIcon}>🔒</Text> : null}
                    {isSelected ? (
                      <View style={[styles.selectedBadge, { backgroundColor: opt.previewAccent }]}>
                        <Text style={[styles.selectedBadgeText, { color: opt.previewBg }]}>✓</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Category colours */}
          <View style={[styles.card, { backgroundColor: theme.bg_surface, borderColor: theme.border_default, marginTop: theme.space_sm }]}>
            <Text style={[styles.cardLabel, { fontFamily: theme.font_body_medium, color: theme.text_secondary }]}>
              Category Colours {!entitlements.hasThemes && <Text style={{ color: theme.brand_gold }}>· Voyager+</Text>}
            </Text>
            {(Object.keys(CATEGORY_LABELS) as CategoryKey[]).map((cat, idx, arr) => (
              <React.Fragment key={cat}>
                <TouchableOpacity
                  style={styles.categoryRow}
                  onPress={() => handleCategoryColourPress(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.settingLabel, { fontFamily: theme.font_body, color: theme.text_primary }]}>
                    {CATEGORY_LABELS[cat]}
                  </Text>
                  <View style={[styles.colourSwatch, { backgroundColor: resolvedCategoryColour(cat) }]} />
                </TouchableOpacity>
                {idx < arr.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </View>

          {/* ── PREFERENCES ─────────────────────────────────────────── */}
          <SectionHeader label="Preferences" />

          <View style={[styles.card, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}>
            <SettingRow
              label="Language"
              value={currentLanguage}
              onPress={handleSelectLanguage}
            />
            <Divider />
            <SettingRow
              label="Currency"
              value={currentCurrency}
              onPress={handleSelectCurrency}
            />
          </View>

          {/* ── NOTIFICATIONS ───────────────────────────────────────── */}
          <SectionHeader label="Notifications" />

          <View style={[styles.card, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}>
            <SettingRow
              label="Trip Reminders"
              right={
                <Switch
                  value={notifyTripReminders}
                  onValueChange={setNotifyTripReminders}
                  trackColor={{ true: theme.interactive_primary }}
                  thumbColor="#fff"
                />
              }
            />
            <Divider />
            <SettingRow
              label="Itinerary Ready"
              right={
                <Switch
                  value={notifyGenerationDone}
                  onValueChange={setNotifyGenerationDone}
                  trackColor={{ true: theme.interactive_primary }}
                  thumbColor="#fff"
                />
              }
            />
            <Divider />
            <SettingRow
              label="Social Updates"
              right={
                <Switch
                  value={notifySocialUpdates}
                  onValueChange={setNotifySocialUpdates}
                  trackColor={{ true: theme.interactive_primary }}
                  thumbColor="#fff"
                />
              }
            />
            <Divider />
            <SettingRow
              label="Transport Disruptions"
              right={
                <Switch
                  value={notifyDisruptions}
                  onValueChange={setNotifyDisruptions}
                  trackColor={{ true: theme.interactive_primary }}
                  thumbColor="#fff"
                />
              }
            />
          </View>

          {/* ── OFFLINE DATA ─────────────────────────────────────────── */}
          <SectionHeader label="Offline Data" />

          <View style={[styles.card, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}>
            <SettingRow
              label="Downloaded Language Packs"
              value={entitlements.hasOfflinePacks ? '2 packs · 84 MB' : 'Voyager+'}
              onPress={
                entitlements.hasOfflinePacks
                  ? () => {}
                  : () => {
                      setUpsellFeature('offline_packs');
                      setUpsellVisible(true);
                    }
              }
            />
            <Divider />
            <SettingRow
              label="Cached Maps"
              value="12 MB"
              onPress={() => {}}
            />
            <Divider />
            <SettingRow
              label="Clear All Offline Data"
              destructive
              onPress={handleClearOfflineData}
            />
          </View>

          {/* ── ACCOUNT ─────────────────────────────────────────────── */}
          <SectionHeader label="Account" />

          <View style={[styles.card, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}>
            <SettingRow label="Email" value={user?.email ?? '—'} />
            <Divider />
            <SettingRow
              label="Subscription"
              value={
                user?.tier === 'nomad_pro'
                  ? 'Nomad Pro'
                  : user?.tier === 'voyager'
                  ? 'Voyager'
                  : 'Explorer (Free)'
              }
              onPress={() => {}}
            />
            <Divider />
            <SettingRow label="Manage Subscription" onPress={() => {}} />
            <Divider />
            <SettingRow label="Referral Code" value={user?.referralCode ?? 'EASYTRIP'} onPress={() => {}} />
            <Divider />
            <SettingRow label="Sign Out" destructive onPress={handleSignOut} />
          </View>

          {/* ── ABOUT ────────────────────────────────────────────────── */}
          <SectionHeader label="About" />

          <View style={[styles.card, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}>
            <SettingRow label="Version" value="1.0.0 (build 42)" />
            <Divider />
            <SettingRow label="Privacy Policy" onPress={() => {}} />
            <Divider />
            <SettingRow label="Terms of Service" onPress={() => {}} />
            <Divider />
            <SettingRow label="Acknowledgements" onPress={() => {}} />
            <Divider />
            <SettingRow label="Rate EasyTrip ⭐" onPress={() => {}} />
          </View>
        </ScrollView>
      </SafeAreaView>

      <UpsellModal
        visible={upsellVisible}
        feature={upsellFeature}
        onDismiss={() => setUpsellVisible(false)}
        onUpgrade={(_tier: UserTier, _annual: boolean) => setUpsellVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16 },
  sectionHeader: {
    fontSize: 11,
    letterSpacing: 1.2,
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  cardLabel: {
    fontSize: 13,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  themeChip: {
    width: '47%',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'column',
    gap: 6,
  },
  themeAccentDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  themeChipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  lockIcon: {
    fontSize: 11,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLabel: {
    fontSize: 16,
    flex: 1,
  },
  settingValue: {
    fontSize: 15,
    marginLeft: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  colourSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
});
