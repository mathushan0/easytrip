import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@theme/useTheme';
import { Button } from '@components/atoms/Button';
import { TextInput } from '@components/atoms/TextInput';
import { ProgressBar } from '@components/atoms/ProgressBar';
import { Chip } from '@components/atoms/Chip';
import type { TripType, TravelPace } from '@/types';

const { width } = Dimensions.get('window');
const STEPS = ['Destination', 'Budget', 'Preferences'];

const TRIP_TYPES: { value: TripType; label: string; emoji: string }[] = [
  { value: 'solo', label: 'Solo', emoji: '🧍' },
  { value: 'couple', label: 'Couple', emoji: '👫' },
  { value: 'family', label: 'Family', emoji: '👨‍👩‍👧' },
  { value: 'group', label: 'Group', emoji: '👥' },
  { value: 'business', label: 'Business', emoji: '💼' },
];

const PACE_OPTIONS: { value: TravelPace; label: string; desc: string; emoji: string }[] = [
  { value: 'relaxed', label: 'Relaxed', desc: '3–4 stops/day', emoji: '😌' },
  { value: 'balanced', label: 'Balanced', desc: '5–6 stops/day', emoji: '⚖️' },
  { value: 'packed', label: 'Packed', desc: '7+ stops/day', emoji: '🏃' },
];

const INTERESTS = [
  'History', 'Food', 'Nature', 'Art', 'Nightlife', 'Shopping',
  'Architecture', 'Music', 'Sports', 'Wellness', 'Photography', 'Local Life',
];

const DIETARY = ['Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-free', 'None'];

export function TripCreatorScreen(): React.ReactElement {
  const { theme } = useTheme();
  const [step, setStep] = useState(0);
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState('GBP');
  const [tripType, setTripType] = useState<TripType>('solo');
  const [pace, setPace] = useState<TravelPace>('balanced');
  const [interests, setInterests] = useState<string[]>([]);
  const [dietary, setDietary] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState('');

  const progressAnim = useSharedValue(0);

  const toggleInterest = (item: string) =>
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );

  const toggleDietary = (item: string) =>
    setDietary((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );

  const goNext = () => {
    if (step < 2) setStep((s) => s + 1);
    else handleGenerate();
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const handleGenerate = async () => {
    setIsGenerating(true);
    const steps = [
      'Analysing destination…',
      'Building day structure…',
      'Finding best venues…',
      'Optimising routes…',
      'Finalising itinerary…',
    ];
    for (let i = 0; i < steps.length; i++) {
      setGenerationStep(steps[i]);
      setGenerationProgress((i + 1) * 20);
      await new Promise((r) => setTimeout(r, 800));
    }
    setIsGenerating(false);
  };

  const canProceed =
    step === 0 ? destination.length > 2 && startDate && endDate :
    step === 1 ? budget.length > 0 :
    true;

  if (isGenerating) {
    return (
      <View style={[styles.generatingContainer, { backgroundColor: theme.bg_primary }]}>
        <ActivityIndicator size="large" color={theme.brand_lime} />
        <Text style={[styles.generatingTitle, { color: theme.text_primary, fontFamily: theme.font_display }]}>
          Crafting your trip ✨
        </Text>
        <Text style={[styles.generatingStep, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
          {generationStep}
        </Text>
        <View style={styles.genProgressWrapper}>
          <ProgressBar
            value={generationProgress}
            max={100}
            color={theme.brand_lime}
            trackColor={theme.bg_surface}
            height={6}
            borderRadius={3}
          />
          <Text style={[styles.genProgressText, { color: theme.text_secondary, fontFamily: theme.font_mono }]}>
            {generationProgress}%
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg_primary }]}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: theme.space_md }]}>
          {step > 0 ? (
            <TouchableOpacity onPress={goBack} style={styles.backBtn}>
              <Text style={[styles.backText, { color: theme.text_secondary }]}>← Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backBtn} />
          )}
          <Text style={[styles.headerTitle, { color: theme.text_primary, fontFamily: theme.font_display }]}>
            New Trip
          </Text>
          <Text style={[styles.stepIndicator, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
            {step + 1}/{STEPS.length}
          </Text>
        </View>

        {/* Step tabs */}
        <View style={[styles.stepTabs, { paddingHorizontal: theme.space_md }]}>
          {STEPS.map((s, i) => (
            <View key={s} style={styles.stepTab}>
              <View
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: i <= step ? theme.brand_lime : theme.bg_raised,
                    borderColor: i === step ? theme.brand_lime : 'transparent',
                  },
                ]}
              >
                {i < step ? (
                  <Text style={styles.stepDotCheck}>✓</Text>
                ) : (
                  <Text style={[styles.stepDotNum, { color: i <= step ? theme.bg_primary : theme.text_disabled }]}>
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text style={[styles.stepLabel, { color: i === step ? theme.text_primary : theme.text_disabled, fontFamily: theme.font_body }]}>
                {s}
              </Text>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, { backgroundColor: i < step ? theme.brand_lime : theme.bg_raised }]} />
              )}
            </View>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: theme.space_md }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Step 0: Destination + Dates */}
          {step === 0 && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: theme.text_primary, fontFamily: theme.font_display }]}>
                Where are you going? 🗺️
              </Text>
              <TextInput
                label="Destination"
                placeholder="e.g. Tokyo, Japan"
                value={destination}
                onChangeText={setDestination}
              />
              <View style={styles.dateRow}>
                <View style={styles.dateField}>
                  <TextInput
                    label="Start date"
                    placeholder="YYYY-MM-DD"
                    value={startDate}
                    onChangeText={setStartDate}
                  />
                </View>
                <View style={styles.dateField}>
                  <TextInput
                    label="End date"
                    placeholder="YYYY-MM-DD"
                    value={endDate}
                    onChangeText={setEndDate}
                  />
                </View>
              </View>
              <View style={[styles.infoBox, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}>
                <Text style={[styles.infoText, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                  💡 You can be vague — "South-East Asia" works too. Our AI will nail down the best base city for you.
                </Text>
              </View>
            </View>
          )}

          {/* Step 1: Budget */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: theme.text_primary, fontFamily: theme.font_display }]}>
                What's your budget? 💰
              </Text>
              <View style={styles.budgetRow}>
                <View style={{ width: 80 }}>
                  <TextInput
                    label="Currency"
                    placeholder="GBP"
                    value={currency}
                    onChangeText={setCurrency}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    label="Total budget"
                    placeholder="e.g. 2000"
                    value={budget}
                    onChangeText={setBudget}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <Text style={[styles.fieldLabel, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                Budget includes
              </Text>
              {['Accommodation', 'Food & Drink', 'Transport', 'Activities', 'Shopping'].map((item) => (
                <View key={item} style={[styles.checkRow, { borderColor: theme.border_default }]}>
                  <View style={[styles.checkbox, { backgroundColor: theme.brand_lime }]}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                  <Text style={[styles.checkLabel, { color: theme.text_primary, fontFamily: theme.font_body }]}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Step 2: Preferences */}
          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: theme.text_primary, fontFamily: theme.font_display }]}>
                Your travel style 🎨
              </Text>

              <Text style={[styles.fieldLabel, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                Travelling as
              </Text>
              <View style={styles.tripTypeGrid}>
                {TRIP_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.value}
                    style={[
                      styles.tripTypeCard,
                      {
                        backgroundColor: tripType === t.value ? `${theme.brand_lime}20` : theme.bg_surface,
                        borderColor: tripType === t.value ? theme.brand_lime : theme.border_default,
                      },
                    ]}
                    onPress={() => setTripType(t.value)}
                  >
                    <Text style={styles.tripTypeEmoji}>{t.emoji}</Text>
                    <Text style={[styles.tripTypeLabel, { color: theme.text_primary, fontFamily: theme.font_body }]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                Travel pace
              </Text>
              <View style={styles.paceRow}>
                {PACE_OPTIONS.map((p) => (
                  <TouchableOpacity
                    key={p.value}
                    style={[
                      styles.paceCard,
                      {
                        backgroundColor: pace === p.value ? `${theme.brand_lime}20` : theme.bg_surface,
                        borderColor: pace === p.value ? theme.brand_lime : theme.border_default,
                        flex: 1,
                      },
                    ]}
                    onPress={() => setPace(p.value)}
                  >
                    <Text style={styles.paceEmoji}>{p.emoji}</Text>
                    <Text style={[styles.paceLabel, { color: theme.text_primary, fontFamily: theme.font_body_medium }]}>
                      {p.label}
                    </Text>
                    <Text style={[styles.paceDesc, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                      {p.desc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                Interests
              </Text>
              <View style={styles.chipsWrap}>
                {INTERESTS.map((item) => (
                  <Chip
                    key={item}
                    label={item}
                    selected={interests.includes(item)}
                    onPress={() => toggleInterest(item)}
                  />
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                Dietary requirements
              </Text>
              <View style={styles.chipsWrap}>
                {DIETARY.map((item) => (
                  <Chip
                    key={item}
                    label={item}
                    selected={dietary.includes(item)}
                    onPress={() => toggleDietary(item)}
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* CTA */}
        <View style={[styles.ctaSection, { paddingHorizontal: theme.space_md, paddingBottom: 24, backgroundColor: theme.bg_primary }]}>
          <Button
            label={step < 2 ? 'Continue →' : '✨ Generate Itinerary'}
            variant="primary"
            size="lg"
            fullWidth
            disabled={!canProceed}
            onPress={goNext}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  backBtn: { width: 60 },
  backText: { fontSize: 15 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  stepIndicator: { fontSize: 13, width: 60, textAlign: 'right' },
  stepTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepTab: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotCheck: { fontSize: 13, color: '#0A0A0F', fontWeight: '700' },
  stepDotNum: { fontSize: 12, fontWeight: '600' },
  stepLabel: { fontSize: 11 },
  stepLine: { flex: 1, height: 2, borderRadius: 1 },
  scrollContent: { paddingBottom: 16 },
  stepContent: { gap: 16 },
  stepTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  dateRow: { flexDirection: 'row', gap: 12 },
  dateField: { flex: 1 },
  infoBox: { borderRadius: 12, borderWidth: 1, padding: 12 },
  infoText: { fontSize: 13, lineHeight: 18 },
  budgetRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-end' },
  fieldLabel: { fontSize: 13, marginTop: 4, marginBottom: 4 },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 10,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: { fontSize: 13, color: '#0A0A0F', fontWeight: '700' },
  checkLabel: { fontSize: 14 },
  tripTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tripTypeCard: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tripTypeEmoji: { fontSize: 22 },
  tripTypeLabel: { fontSize: 10, textAlign: 'center' },
  paceRow: { flexDirection: 'row', gap: 10 },
  paceCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  paceEmoji: { fontSize: 22 },
  paceLabel: { fontSize: 13 },
  paceDesc: { fontSize: 10 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ctaSection: {
    borderTopWidth: 1,
    paddingTop: 16,
  },
  generatingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  generatingTitle: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  generatingStep: { fontSize: 15, textAlign: 'center' },
  genProgressWrapper: { width: '100%', gap: 8, marginTop: 8 },
  genProgressText: { fontSize: 12, textAlign: 'center' },
});
