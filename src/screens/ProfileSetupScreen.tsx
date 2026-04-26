// ─────────────────────────────────────────────────────────────────────────────
// PROFILE SETUP SCREEN (Item 22)
// Home currency dropdown (GBP default)
// Languages spoken multi-select
// Both skippable — never shows again after first login
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '@theme/useTheme';
import { FONT_FAMILIES } from '@theme/fonts';
import { Button } from '@components/shared/Button';
import { Chip } from '@components/shared/Chip';
import { useUserStore } from '@stores/userStore';
import type { RootStackParamList } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileSetup'>;

// ─── Data ─────────────────────────────────────────────────────────────────────

const CURRENCIES = [
  { code: 'GBP', label: '🇬🇧 British Pound (GBP)' },
  { code: 'USD', label: '🇺🇸 US Dollar (USD)' },
  { code: 'EUR', label: '🇪🇺 Euro (EUR)' },
  { code: 'JPY', label: '🇯🇵 Japanese Yen (JPY)' },
  { code: 'AUD', label: '🇦🇺 Australian Dollar (AUD)' },
  { code: 'CAD', label: '🇨🇦 Canadian Dollar (CAD)' },
  { code: 'CHF', label: '🇨🇭 Swiss Franc (CHF)' },
  { code: 'CNY', label: '🇨🇳 Chinese Yuan (CNY)' },
  { code: 'INR', label: '🇮🇳 Indian Rupee (INR)' },
  { code: 'SGD', label: '🇸🇬 Singapore Dollar (SGD)' },
];

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Dutch', 'Japanese', 'Korean', 'Mandarin', 'Cantonese', 'Arabic',
  'Hindi', 'Russian', 'Turkish', 'Polish', 'Swedish', 'Norwegian',
  'Danish', 'Finnish', 'Greek', 'Hebrew', 'Thai', 'Vietnamese',
];

export function ProfileSetupScreen({ navigation }: Props): React.ReactElement {
  const { theme } = useTheme();
  const { setUser, user } = useUserStore();

  const [currency, setCurrency] = useState('GBP');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English']);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Persist to user store / API
      if (user) {
        setUser({ ...user, homeCurrency: currency, languages: selectedLanguages, profileSetupDone: true });
      }
    } catch {
      // Non-blocking — skip proceeds regardless
    } finally {
      setLoading(false);
      navigation.replace('Main');
    }
  };

  const handleSkip = () => {
    if (user) {
      setUser({ ...user, profileSetupDone: true });
    }
    navigation.replace('Main');
  };

  const selectedCurrencyLabel =
    CURRENCIES.find((c) => c.code === currency)?.label ?? currency;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg_primary }]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <Text
          style={[
            styles.heading,
            { fontFamily: FONT_FAMILIES.fredokaBold, color: theme.text_primary },
          ]}
        >
          Quick setup 🌍
        </Text>
        <Text
          style={[
            styles.subheading,
            { fontFamily: FONT_FAMILIES.nunitoSemiBold, color: theme.text_secondary },
          ]}
        >
          Just two things to personalise your experience. You can skip either — change them later in Settings.
        </Text>

        {/* Currency */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionLabel,
              { fontFamily: FONT_FAMILIES.nunitoBold, color: theme.text_primary },
            ]}
          >
            Home currency
          </Text>
          <TouchableOpacity
            style={[
              styles.dropdownBtn,
              { borderColor: theme.text_primary, backgroundColor: theme.bg_surface },
            ]}
            onPress={() => setCurrencyModalVisible(true)}
          >
            <Text
              style={[
                styles.dropdownText,
                { fontFamily: FONT_FAMILIES.nunitoSemiBold, color: theme.text_primary },
              ]}
            >
              {selectedCurrencyLabel}
            </Text>
            <Text style={{ color: theme.text_secondary }}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Languages */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionLabel,
              { fontFamily: FONT_FAMILIES.nunitoBold, color: theme.text_primary },
            ]}
          >
            Languages you speak
          </Text>
          <View style={styles.langGrid}>
            {LANGUAGES.map((lang) => (
              <Chip
                key={lang}
                label={lang}
                selected={selectedLanguages.includes(lang)}
                onPress={() => toggleLanguage(lang)}
                style={styles.langChip}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: theme.border_default }]}>
        <Button
          label={loading ? 'Saving…' : 'Save & Continue'}
          variant="primary"
          disabled={loading}
          onPress={handleSave}
        />
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text
            style={[
              styles.skipText,
              { fontFamily: FONT_FAMILIES.nunitoSemiBold, color: theme.text_secondary },
            ]}
          >
            Skip for now
          </Text>
        </TouchableOpacity>
      </View>

      {/* Currency picker modal */}
      <Modal
        visible={currencyModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <SafeAreaView style={[styles.modal, { backgroundColor: theme.bg_primary }]}>
          <View style={styles.modalHeader}>
            <Text
              style={[
                styles.modalTitle,
                { fontFamily: FONT_FAMILIES.fredokaBold, color: theme.text_primary },
              ]}
            >
              Choose currency
            </Text>
            <TouchableOpacity onPress={() => setCurrencyModalVisible(false)}>
              <Text
                style={[
                  styles.closeBtn,
                  { fontFamily: FONT_FAMILIES.nunitoBold, color: theme.interactive_primary },
                ]}
              >
                Done
              </Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={CURRENCIES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.currencyRow,
                  { borderBottomColor: theme.border_default },
                  item.code === currency && { backgroundColor: theme.interactive_ghost },
                ]}
                onPress={() => {
                  setCurrency(item.code);
                  setCurrencyModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.currencyText,
                    { fontFamily: FONT_FAMILIES.nunitoSemiBold, color: theme.text_primary },
                  ]}
                >
                  {item.label}
                </Text>
                {item.code === currency ? (
                  <Text style={{ color: theme.interactive_primary }}>✓</Text>
                ) : null}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 40 },
  heading: { fontSize: 30, marginBottom: 12 },
  subheading: { fontSize: 15, lineHeight: 24, marginBottom: 28 },
  section: { marginBottom: 28 },
  sectionLabel: { fontSize: 16, marginBottom: 12 },
  dropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 3,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  dropdownText: { fontSize: 16 },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  langChip: { marginBottom: 0 },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
    alignItems: 'center',
  },
  skipBtn: { paddingVertical: 8 },
  skipText: { fontSize: 15 },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: { fontSize: 24 },
  closeBtn: { fontSize: 16 },
  currencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  currencyText: { fontSize: 16 },
});
