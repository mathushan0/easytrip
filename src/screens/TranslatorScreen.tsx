import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput as RNTextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/useTheme';
import { Button } from '@components/atoms/Button';
import { PremiumBadge } from '@components/molecules/PremiumBadge';
import type { PhrasebookEntry, PhraseCategory } from '@/types';

const LANGUAGES = [
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
];

const MOCK_PHRASES: PhrasebookEntry[] = [
  {
    id: 'p1', languageCode: 'ja', languageName: 'Japanese',
    category: 'greetings', phraseEn: 'Hello / Good morning',
    phraseNative: 'おはようございます', romanisation: 'Ohayou gozaimasu',
    phonetic: 'Oh-ha-yoh go-zai-mass', audioUrl: null, audioGeneratedAt: null,
    isCustom: false, createdAt: '',
  },
  {
    id: 'p2', languageCode: 'ja', languageName: 'Japanese',
    category: 'food', phraseEn: 'A table for two, please',
    phraseNative: '二人用のテーブルをお願いします', romanisation: 'Futari you no teeburu o onegai shimasu',
    phonetic: 'Foo-tah-ree yoh no teh-boo-roo oh oh-neh-gai she-mass', audioUrl: null, audioGeneratedAt: null,
    isCustom: false, createdAt: '',
  },
  {
    id: 'p3', languageCode: 'ja', languageName: 'Japanese',
    category: 'transport', phraseEn: 'How do I get to…?',
    phraseNative: '…へはどうやって行けますか？', romanisation: '…e wa dou yatte ikemasu ka?',
    phonetic: '...eh wa doh yat-teh ee-keh-mass ka?', audioUrl: null, audioGeneratedAt: null,
    isCustom: false, createdAt: '',
  },
  {
    id: 'p4', languageCode: 'ja', languageName: 'Japanese',
    category: 'emergency', phraseEn: 'Please call an ambulance',
    phraseNative: '救急車を呼んでください', romanisation: 'Kyuukyuusha o yonde kudasai',
    phonetic: 'Kyuu-kyuu-sha oh yon-deh koo-dah-sai', audioUrl: null, audioGeneratedAt: null,
    isCustom: false, createdAt: '',
  },
  {
    id: 'p5', languageCode: 'ja', languageName: 'Japanese',
    category: 'shopping', phraseEn: 'How much does this cost?',
    phraseNative: 'これはいくらですか？', romanisation: 'Kore wa ikura desu ka?',
    phonetic: 'Koh-reh wa ee-koo-rah des ka?', audioUrl: null, audioGeneratedAt: null,
    isCustom: false, createdAt: '',
  },
];

const PHRASE_CATS: PhraseCategory[] = ['greetings', 'food', 'transport', 'shopping', 'emergency', 'accommodation', 'general'];
const CAT_LABELS: Record<PhraseCategory, string> = {
  greetings: '👋 Greetings',
  food: '🍜 Food',
  transport: '🚆 Transport',
  shopping: '🛍 Shopping',
  emergency: '🚨 Emergency',
  accommodation: '🏨 Stay',
  general: '💬 General',
};

type Tab = 'translate' | 'phrasebook';

export function TranslatorScreen(): React.ReactElement {
  const { theme } = useTheme();
  const [tab, setTab] = useState<Tab>('translate');
  const [sourceLang, setSourceLang] = useState(LANGUAGES[1]); // English
  const [targetLang, setTargetLang] = useState(LANGUAGES[0]); // Japanese
  const [inputText, setInputText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [romanisation, setRomanisation] = useState('');
  const [selectedCat, setSelectedCat] = useState<PhraseCategory>('greetings');
  const [savedPhrases, setSavedPhrases] = useState<string[]>([]);
  const isPro = false;

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setIsTranslating(true);
    await new Promise((r) => setTimeout(r, 1000));
    setTranslatedText('こんにちは！お元気ですか？');
    setRomanisation('Konnichiwa! Ogenki desu ka?');
    setIsTranslating(false);
  };

  const swapLanguages = () => {
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    setInputText(translatedText);
    setTranslatedText(inputText);
  };

  const toggleSaved = (id: string) =>
    setSavedPhrases((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );

  const filteredPhrases = MOCK_PHRASES.filter((p) => p.category === selectedCat);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg_primary }]}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: theme.space_md }]}>
          <Text style={[styles.headerTitle, { color: theme.text_primary, fontFamily: theme.font_display }]}>
            Translator 🌐
          </Text>
        </View>

        {/* Tabs */}
        <View style={[styles.tabRow, { paddingHorizontal: theme.space_md }]}>
          {(['translate', 'phrasebook'] as Tab[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.tabBtn,
                {
                  backgroundColor: tab === t ? theme.interactive_primary : theme.bg_surface,
                  borderColor: tab === t ? theme.interactive_primary : theme.border_default,
                },
              ]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, { color: tab === t ? theme.text_inverse : theme.text_secondary, fontFamily: theme.font_body_medium }]}>
                {t === 'translate' ? '💬 Translate' : '📖 Phrasebook'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'translate' ? (
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingHorizontal: theme.space_md }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Language pair */}
            <View style={styles.langPairRow}>
              <TouchableOpacity style={[styles.langPicker, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}>
                <Text style={styles.langFlag}>{sourceLang.flag}</Text>
                <Text style={[styles.langName, { color: theme.text_primary, fontFamily: theme.font_body_medium }]}>
                  {sourceLang.name}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={swapLanguages} style={[styles.swapBtn, { backgroundColor: theme.bg_raised }]}>
                <Text style={styles.swapIcon}>⇄</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.langPicker, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}>
                <Text style={styles.langFlag}>{targetLang.flag}</Text>
                <Text style={[styles.langName, { color: theme.text_primary, fontFamily: theme.font_body_medium }]}>
                  {targetLang.name}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Input */}
            <View style={[styles.inputCard, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}>
              <RNTextInput
                style={[
                  styles.textArea,
                  { color: theme.text_primary, fontFamily: theme.font_body, fontSize: 16 },
                ]}
                multiline
                placeholder="Type something to translate…"
                placeholderTextColor={theme.text_disabled}
                value={inputText}
                onChangeText={setInputText}
              />
              <View style={styles.inputActions}>
                <TouchableOpacity
                  style={[styles.ocrBtn, { borderColor: theme.border_default }]}
                >
                  {isPro ? (
                    <Text style={[styles.ocrText, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                      📷 Camera OCR
                    </Text>
                  ) : (
                    <View style={styles.ocrRow}>
                      <Text style={[styles.ocrText, { color: theme.text_disabled, fontFamily: theme.font_body }]}>
                        📷 Camera OCR
                      </Text>
                      <PremiumBadge tier="voyager" />
                    </View>
                  )}
                </TouchableOpacity>
                <Button
                  label={isTranslating ? '…' : 'Translate'}
                  variant="primary"
                  size="sm"
                  loading={isTranslating}
                  onPress={handleTranslate}
                  disabled={!inputText.trim()}
                />
              </View>
            </View>

            {/* Output */}
            {translatedText ? (
              <View style={[styles.outputCard, { backgroundColor: `${theme.brand_cyan}10`, borderColor: theme.brand_cyan }]}>
                <Text style={[styles.outputText, { color: theme.text_primary, fontFamily: theme.font_body, fontSize: 20 }]}>
                  {translatedText}
                </Text>
                {romanisation ? (
                  <Text style={[styles.romanisationText, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                    {romanisation}
                  </Text>
                ) : null}
                <View style={styles.outputActions}>
                  <TouchableOpacity style={[styles.outputActionBtn, { backgroundColor: theme.bg_raised }]}>
                    <Text style={[{ color: theme.text_secondary, fontFamily: theme.font_body, fontSize: 13 }]}>
                      🔊 Play
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.outputActionBtn, { backgroundColor: theme.bg_raised }]}>
                    <Text style={[{ color: theme.text_secondary, fontFamily: theme.font_body, fontSize: 13 }]}>
                      📋 Copy
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.outputActionBtn, { backgroundColor: theme.bg_raised }]}>
                    <Text style={[{ color: theme.text_secondary, fontFamily: theme.font_body, fontSize: 13 }]}>
                      ⭐ Save
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            <View style={{ height: 32 }} />
          </ScrollView>
        ) : (
          <View style={styles.phrasebookContainer}>
            {/* Category picker */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.catScroll, { paddingHorizontal: theme.space_md }]}
            >
              {PHRASE_CATS.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: selectedCat === cat ? theme.interactive_primary : theme.bg_surface,
                      borderColor: selectedCat === cat ? theme.interactive_primary : theme.border_default,
                    },
                  ]}
                  onPress={() => setSelectedCat(cat)}
                >
                  <Text style={[styles.catLabel, { color: selectedCat === cat ? theme.text_inverse : theme.text_secondary, fontFamily: theme.font_body }]}>
                    {CAT_LABELS[cat]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView
              contentContainerStyle={[styles.phrasesScroll, { paddingHorizontal: theme.space_md }]}
              showsVerticalScrollIndicator={false}
            >
              {filteredPhrases.length === 0 ? (
                <View style={styles.emptyPhrases}>
                  <Text style={[{ color: theme.text_secondary, fontFamily: theme.font_body }]}>
                    No phrases in this category yet.
                  </Text>
                </View>
              ) : (
                filteredPhrases.map((phrase) => {
                  const isSaved = savedPhrases.includes(phrase.id);
                  return (
                    <View key={phrase.id} style={[styles.phraseCard, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}>
                      <View style={styles.phraseHeader}>
                        <Text style={[styles.phraseEn, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                          {phrase.phraseEn}
                        </Text>
                        <TouchableOpacity onPress={() => toggleSaved(phrase.id)}>
                          <Text style={{ fontSize: 18 }}>{isSaved ? '⭐' : '☆'}</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={[styles.phraseNative, { color: theme.text_primary, fontFamily: theme.font_display, fontSize: 18 }]}>
                        {phrase.phraseNative}
                      </Text>
                      {phrase.romanisation && (
                        <Text style={[styles.phraseRoman, { color: theme.brand_cyan, fontFamily: theme.font_body }]}>
                          {phrase.romanisation}
                        </Text>
                      )}
                      {phrase.phonetic && (
                        <Text style={[styles.phrasePhonetic, { color: theme.text_disabled, fontFamily: theme.font_mono }]}>
                          /{phrase.phonetic}/
                        </Text>
                      )}
                      <View style={styles.phraseActions}>
                        <TouchableOpacity style={[styles.playBtn, { backgroundColor: theme.bg_raised }]}>
                          <Text style={[{ color: theme.text_secondary, fontSize: 12, fontFamily: theme.font_body }]}>
                            🔊 Play
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
              {/* Saved phrases section */}
              {savedPhrases.length > 0 && (
                <View style={styles.savedSection}>
                  <Text style={[styles.savedTitle, { color: theme.text_primary, fontFamily: theme.font_display }]}>
                    ⭐ Saved Phrases
                  </Text>
                  {MOCK_PHRASES.filter((p) => savedPhrases.includes(p.id)).map((phrase) => (
                    <View key={`saved-${phrase.id}`} style={[styles.savedChip, { backgroundColor: `${theme.brand_gold}20`, borderColor: theme.brand_gold }]}>
                      <Text style={[{ color: theme.brand_gold, fontFamily: theme.font_body, fontSize: 13 }]}>
                        {phrase.phraseEn} → {phrase.phraseNative}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              <View style={{ height: 32 }} />
            </ScrollView>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: { paddingTop: 8, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  tabRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  tabBtn: { flex: 1, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 14 },
  scrollContent: { gap: 16, paddingTop: 4 },
  langPairRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  langPicker: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  langFlag: { fontSize: 22 },
  langName: { fontSize: 14 },
  swapBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapIcon: { fontSize: 20 },
  inputCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  inputActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ocrBtn: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  ocrRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ocrText: { fontSize: 13 },
  outputCard: { borderRadius: 16, borderWidth: 1.5, padding: 16, gap: 10 },
  outputText: { lineHeight: 28 },
  romanisationText: { fontSize: 14, lineHeight: 20 },
  outputActions: { flexDirection: 'row', gap: 10 },
  outputActionBtn: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  phrasebookContainer: { flex: 1 },
  catScroll: { gap: 8, paddingBottom: 12 },
  catChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7 },
  catLabel: { fontSize: 13 },
  phrasesScroll: { gap: 12, paddingTop: 8 },
  emptyPhrases: { alignItems: 'center', padding: 32 },
  phraseCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  phraseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  phraseEn: { fontSize: 13, flex: 1 },
  phraseNative: { lineHeight: 26 },
  phraseRoman: { fontSize: 13 },
  phrasePhonetic: { fontSize: 11 },
  phraseActions: { flexDirection: 'row' },
  playBtn: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  savedSection: { gap: 10, marginTop: 8 },
  savedTitle: { fontSize: 16, fontWeight: '700' },
  savedChip: { borderRadius: 10, borderWidth: 1, padding: 10 },
});
