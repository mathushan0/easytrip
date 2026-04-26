// ─────────────────────────────────────────────────────────────────────────────
// CONSENT SCREEN (Item 14)
// Three toggles OFF by default: Analytics, Crash Reports, Push Notifications
// Plain English copy, Learn More → Privacy Policy modal
// Continue button always active
// No PostHog/Sentry/Firebase calls before consent given
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '@theme/useTheme';
import { FONT_FAMILIES } from '@theme/fonts';
import { Button } from '@components/shared/Button';
import { useConsentStore, type ConsentChoices } from '@stores/uiStore';
import type { RootStackParamList } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Consent'>;

interface ConsentItem {
  key: keyof ConsentChoices;
  title: string;
  description: string;
}

const CONSENT_ITEMS: ConsentItem[] = [
  {
    key: 'analytics',
    title: 'Usage Analytics',
    description:
      'Help us improve EasyTrip by sharing anonymous data about how you use the app. We never sell your data.',
  },
  {
    key: 'crashReports',
    title: 'Crash Reports',
    description:
      'Automatically send crash logs so we can fix bugs faster. Reports contain no personal information.',
  },
  {
    key: 'pushNotifications',
    title: 'Push Notifications',
    description:
      'Get trip reminders, deal alerts, and updates from your travel crew. You can change this in Settings anytime.',
  },
];

export function ConsentScreen({ navigation }: Props): React.ReactElement {
  const { theme } = useTheme();
  const { setConsent, markConsentShown } = useConsentStore();

  const [choices, setChoices] = useState<ConsentChoices>({
    analytics: false,
    crashReports: false,
    pushNotifications: false,
  });

  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);

  const toggle = (key: keyof ConsentChoices) => {
    setChoices((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleContinue = () => {
    // Persist choices — no 3rd party SDKs called until consent is set
    setConsent(choices);
    markConsentShown();
    navigation.replace('SignIn');
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg_primary }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Text
          style={[
            styles.heading,
            { fontFamily: FONT_FAMILIES.fredokaBold, color: theme.text_primary },
          ]}
        >
          Your privacy, your choice ✌️
        </Text>
        <Text
          style={[
            styles.subheading,
            { fontFamily: FONT_FAMILIES.nunitoSemiBold, color: theme.text_secondary },
          ]}
        >
          Before we get started, choose what you're comfortable sharing. You can
          change these in Settings at any time.
        </Text>

        {/* Consent toggles */}
        <View style={[styles.card, { backgroundColor: theme.bg_surface, borderColor: theme.text_primary }]}>
          {CONSENT_ITEMS.map((item, idx) => (
            <View
              key={item.key}
              style={[
                styles.row,
                idx < CONSENT_ITEMS.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border_default,
                },
              ]}
            >
              <View style={styles.rowText}>
                <Text
                  style={[
                    styles.itemTitle,
                    { fontFamily: FONT_FAMILIES.nunitoBold, color: theme.text_primary },
                  ]}
                >
                  {item.title}
                </Text>
                <Text
                  style={[
                    styles.itemDesc,
                    { fontFamily: FONT_FAMILIES.nunitoSemiBold, color: theme.text_secondary },
                  ]}
                >
                  {item.description}
                </Text>
              </View>
              <Switch
                value={choices[item.key]}
                onValueChange={() => toggle(item.key)}
                trackColor={{
                  false: theme.border_default,
                  true: theme.interactive_primary,
                }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}
        </View>

        {/* Learn More */}
        <TouchableOpacity
          onPress={() => setPrivacyModalVisible(true)}
          style={styles.learnMore}
        >
          <Text
            style={[
              styles.learnMoreText,
              { fontFamily: FONT_FAMILIES.nunitoBold, color: theme.interactive_primary },
            ]}
          >
            Learn More about our Privacy Policy →
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Continue — always active */}
      <View style={[styles.footer, { borderTopColor: theme.border_default }]}>
        <Button label="Continue" variant="primary" onPress={handleContinue} />
      </View>

      {/* Privacy Policy modal */}
      <Modal
        visible={privacyModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <SafeAreaView style={[styles.modal, { backgroundColor: theme.bg_primary }]}>
          <View style={styles.modalHeader}>
            <Text
              style={[
                styles.modalTitle,
                { fontFamily: FONT_FAMILIES.fredokaBold, color: theme.text_primary },
              ]}
            >
              Privacy Policy
            </Text>
            <TouchableOpacity onPress={() => setPrivacyModalVisible(false)}>
              <Text
                style={[
                  styles.closeBtn,
                  { fontFamily: FONT_FAMILIES.nunitoBold, color: theme.interactive_primary },
                ]}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll} contentContainerStyle={{ padding: 20 }}>
            <Text
              style={[
                styles.policyText,
                { fontFamily: FONT_FAMILIES.nunitoSemiBold, color: theme.text_secondary },
              ]}
            >
              {`EasyTrip is committed to protecting your privacy.\n\nWe collect only what we need to make the app work. We never sell your personal data to third parties.\n\nAnalytics data is anonymised before transmission. Crash reports contain no identifiable information.\n\nPush notification preferences can be revoked at any time via your device settings or within the app.\n\nFor the full privacy policy, visit easytrip.app/privacy.`}
            </Text>
          </ScrollView>
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
  card: {
    borderRadius: 20,
    borderWidth: 3,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  rowText: { flex: 1 },
  itemTitle: { fontSize: 16, marginBottom: 4 },
  itemDesc: { fontSize: 13, lineHeight: 20 },
  learnMore: { marginTop: 20, alignSelf: 'center' },
  learnMoreText: { fontSize: 14 },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: { fontSize: 24 },
  closeBtn: { fontSize: 16 },
  modalScroll: { flex: 1 },
  policyText: { fontSize: 15, lineHeight: 26 },
});
