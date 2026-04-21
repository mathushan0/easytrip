import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  type ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/useTheme';
import { useUserStore } from '@stores/userStore';
import { useTripStore } from '@stores/tripStore';
import { UpsellModal } from '@components/molecules/UpsellModal';
import type { AiMessage, UserTier } from '@/types';

const { width } = Dimensions.get('window');

// ─── Mock conversation data ────────────────────────────────────────────────

const MOCK_TRIP_NAME = 'Tokyo, Japan';
const MOCK_TRIP_DAY = 2;

const MOCK_MESSAGES: AiMessage[] = [
  {
    id: 'm1',
    conversationId: 'c1',
    role: 'assistant',
    content: `Hey! I'm your AI travel companion for **${MOCK_TRIP_NAME}**. I know your full itinerary — ask me anything! 🗾`,
    tokenCount: 32,
    modelUsed: 'gpt-4o',
    createdAt: '2026-04-21T08:00:00Z',
  },
  {
    id: 'm2',
    conversationId: 'c1',
    role: 'user',
    content: "What's the best time to visit Tsukiji Outer Market today?",
    tokenCount: 14,
    modelUsed: null,
    createdAt: '2026-04-21T08:01:00Z',
  },
  {
    id: 'm3',
    conversationId: 'c1',
    role: 'assistant',
    content:
      "Tsukiji Outer Market is best visited early morning — aim for **7–9 AM** before the crowds arrive. You have it scheduled for 9 AM on Day 2, which is perfect for a relaxed browse. Grab a tamagoyaki skewer from Tamagoya — it's iconic! 🍳",
    tokenCount: 58,
    modelUsed: 'gpt-4o',
    createdAt: '2026-04-21T08:01:20Z',
  },
  {
    id: 'm4',
    conversationId: 'c1',
    role: 'user',
    content: "Can you move my afternoon around? I want to visit teamLab Planets instead.",
    tokenCount: 18,
    modelUsed: null,
    createdAt: '2026-04-21T08:03:00Z',
  },
  {
    id: 'm5',
    conversationId: 'c1',
    role: 'assistant',
    content:
      "Great choice! teamLab Planets is stunning. I'd suggest swapping your **Odaiba afternoon slot** (currently Palette Town) for teamLab Planets in Toyosu — they're close. Book tickets in advance as they sell out fast: [teamlab.art/e/planets](https://teamlab.art/e/planets). Want me to update Day 2 in your itinerary? ✨",
    tokenCount: 72,
    modelUsed: 'gpt-4o',
    createdAt: '2026-04-21T08:03:35Z',
  },
];

// ─── Quick actions ─────────────────────────────────────────────────────────

interface QuickAction {
  id: string;
  label: string;
  emoji: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'q1', label: 'What should I do now?', emoji: '🧭' },
  { id: 'q2', label: 'Find a restaurant nearby', emoji: '🍜' },
  { id: 'q3', label: 'Replan my afternoon', emoji: '🔄' },
  { id: 'q4', label: "What's the weather like?", emoji: '🌤️' },
  { id: 'q5', label: 'Budget check', emoji: '💰' },
];

// ─── Message bubble ────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: AiMessage;
}

function MessageBubble({ message }: MessageBubbleProps): React.ReactElement {
  const { theme } = useTheme();
  const isUser = message.role === 'user';

  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAI]}>
      {!isUser && (
        <View style={[styles.aiBadge, { backgroundColor: theme.interactive_primary }]}>
          <Text style={[styles.aiBadgeText, { color: theme.bg_primary }]}>AI</Text>
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.bubbleUser, { backgroundColor: theme.interactive_primary }]
            : [styles.bubbleAI, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }],
          { maxWidth: width * 0.78 },
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            {
              fontFamily: theme.font_body,
              color: isUser ? theme.bg_primary : theme.text_primary,
            },
          ]}
        >
          {message.content}
        </Text>
        <Text
          style={[
            styles.bubbleTime,
            {
              fontFamily: theme.font_mono,
              color: isUser ? 'rgba(0,0,0,0.4)' : theme.text_disabled,
            },
          ]}
        >
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Context bar ───────────────────────────────────────────────────────────

function ContextBar({ tripName, day }: { tripName: string; day: number }): React.ReactElement {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.contextBar,
        { backgroundColor: theme.bg_raised, borderBottomColor: theme.border_default },
      ]}
    >
      <Text style={[styles.contextEmoji]}>✈️</Text>
      <Text style={[styles.contextText, { fontFamily: theme.font_body, color: theme.text_secondary }]}>
        {tripName}
      </Text>
      <View style={[styles.contextDayBadge, { backgroundColor: theme.interactive_ghost }]}>
        <Text style={[styles.contextDayText, { fontFamily: theme.font_mono, color: theme.interactive_primary }]}>
          Day {day}
        </Text>
      </View>
    </View>
  );
}

// ─── Premium gate ─────────────────────────────────────────────────────────

function PremiumGate({ onUpgrade }: { onUpgrade: () => void }): React.ReactElement {
  const { theme } = useTheme();
  return (
    <View style={[styles.gateContainer, { backgroundColor: theme.bg_primary }]}>
      <Text style={styles.gateIcon}>🤖</Text>
      <Text
        style={[styles.gateTitle, { fontFamily: theme.font_display, color: theme.text_primary }]}
      >
        AI Trip Assistant
      </Text>
      <Text
        style={[styles.gateBody, { fontFamily: theme.font_body, color: theme.text_secondary }]}
      >
        Chat with your itinerary. Ask anything, replan on the fly, get smart venue recommendations — your personal AI travel companion.
      </Text>
      <View style={styles.gateBullets}>
        {['Knows your full itinerary', 'Real-time replanning', 'Budget intelligence', 'Venue suggestions'].map(
          (b) => (
            <View key={b} style={styles.gateBulletRow}>
              <Text style={[styles.gateBulletDot, { color: theme.interactive_primary }]}>✓</Text>
              <Text style={[styles.gateBulletText, { fontFamily: theme.font_body, color: theme.text_primary }]}>
                {b}
              </Text>
            </View>
          ),
        )}
      </View>
      <TouchableOpacity
        style={[styles.gateBtn, { backgroundColor: theme.interactive_primary }]}
        onPress={onUpgrade}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Upgrade to Nomad Pro"
      >
        <Text style={[styles.gateBtnText, { fontFamily: theme.font_display, color: theme.bg_primary }]}>
          Unlock with Nomad Pro
        </Text>
      </TouchableOpacity>
      <Text style={[styles.gatePricing, { fontFamily: theme.font_body, color: theme.text_disabled }]}>
        £2.99/month · £24.99/year
      </Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────

export function AIAssistantScreen(): React.ReactElement {
  const { theme } = useTheme();
  const { entitlements } = useUserStore();
  const { activeTrip, activeDayIndex } = useTripStore();

  const [messages, setMessages] = useState<AiMessage[]>(MOCK_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [upsellVisible, setUpsellVisible] = useState(false);

  const listRef = useRef<FlatList<AiMessage>>(null);
  const tripName = activeTrip?.destination ?? MOCK_TRIP_NAME;
  const currentDay = activeDayIndex + 1 || MOCK_TRIP_DAY;

  const hasPro = entitlements.hasAiAssistant;

  function handleOpenUpsell(): void {
    setUpsellVisible(true);
  }

  const sendMessage = useCallback(
    (text: string): void => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const userMsg: AiMessage = {
        id: `u_${Date.now()}`,
        conversationId: 'c1',
        role: 'user',
        content: trimmed,
        tokenCount: null,
        modelUsed: null,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputText('');
      setIsTyping(true);

      // Simulate AI response
      setTimeout(() => {
        const aiMsg: AiMessage = {
          id: `ai_${Date.now()}`,
          conversationId: 'c1',
          role: 'assistant',
          content: getMockReply(trimmed),
          tokenCount: 42,
          modelUsed: 'gpt-4o',
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsTyping(false);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      }, 1400);

      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    },
    [],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<AiMessage>) => <MessageBubble message={item} />,
    [],
  );

  const keyExtractor = useCallback((item: AiMessage) => item.id, []);

  if (!hasPro) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg_primary }]}>
        <SafeAreaView edges={['top']} style={styles.safe}>
          <PremiumGate onUpgrade={handleOpenUpsell} />
        </SafeAreaView>
        <UpsellModal
          visible={upsellVisible}
          feature="ai_assistant"
          onDismiss={() => setUpsellVisible(false)}
          onUpgrade={(_tier: UserTier, _annual: boolean) => setUpsellVisible(false)}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg_primary }]}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border_default }]}>
          <Text style={[styles.headerTitle, { fontFamily: theme.font_display, color: theme.text_primary }]}>
            AI Assistant
          </Text>
          <View style={[styles.proBadge, { backgroundColor: theme.interactive_primary }]}>
            <Text style={[styles.proBadgeText, { color: theme.bg_primary, fontFamily: theme.font_body_medium }]}>
              PRO
            </Text>
          </View>
        </View>

        {/* Context bar */}
        <ContextBar tripName={tripName} day={currentDay} />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {/* Messages */}
          <FlatList
            ref={listRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListFooterComponent={
              isTyping ? (
                <View style={styles.typingRow}>
                  <View style={[styles.aiBadge, { backgroundColor: theme.interactive_primary }]}>
                    <Text style={[styles.aiBadgeText, { color: theme.bg_primary }]}>AI</Text>
                  </View>
                  <View style={[styles.typingBubble, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}>
                    <ActivityIndicator size="small" color={theme.text_secondary} />
                    <Text style={[styles.typingText, { fontFamily: theme.font_body, color: theme.text_secondary }]}>
                      Thinking…
                    </Text>
                  </View>
                </View>
              ) : null
            }
          />

          {/* Quick actions */}
          <View>
            <FlatList
              data={QUICK_ACTIONS}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickActions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.quickAction, { backgroundColor: theme.bg_raised, borderColor: theme.border_default }]}
                  onPress={() => sendMessage(item.label)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                >
                  <Text style={styles.quickActionEmoji}>{item.emoji}</Text>
                  <Text style={[styles.quickActionLabel, { fontFamily: theme.font_body, color: theme.text_primary }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Input row */}
          <View
            style={[
              styles.inputRow,
              {
                backgroundColor: theme.bg_surface,
                borderTopColor: theme.border_default,
              },
            ]}
          >
            <TextInput
              style={[
                styles.input,
                {
                  fontFamily: theme.font_body,
                  color: theme.text_primary,
                  backgroundColor: theme.bg_raised,
                  borderColor: inputText.length > 0 ? theme.border_focus : theme.border_default,
                },
              ]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask anything about your trip…"
              placeholderTextColor={theme.text_disabled}
              multiline
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={() => sendMessage(inputText)}
              blurOnSubmit
              accessibilityLabel="Message input"
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                {
                  backgroundColor:
                    inputText.trim().length > 0 ? theme.interactive_primary : theme.bg_raised,
                },
              ]}
              onPress={() => sendMessage(inputText)}
              disabled={inputText.trim().length === 0 || isTyping}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Send message"
            >
              <Text style={[styles.sendBtnIcon, { color: inputText.trim().length > 0 ? theme.bg_primary : theme.text_disabled }]}>
                ↑
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ─── Mock AI reply generator ───────────────────────────────────────────────

function getMockReply(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('restaurant') || lower.includes('food') || lower.includes('eat')) {
    return "Based on your location and day plan, I'd recommend **Ichiran Ramen** (solo-dining friendly, 5 min walk) or **Tsuta Ramen** for a Michelin-starred bowl. Both fit your budget at around ¥1,200–¥2,000. Want me to add one to your itinerary? 🍜";
  }
  if (lower.includes('replan') || lower.includes('afternoon')) {
    return "Your afternoon has Ueno Park → Akihabara → Dinner. I can swap Akihabara for **Yanaka Ginza** (quieter, more local feel) if you prefer. Or keep Akihabara for the full tech/anime experience. What's your vibe today? 🔄";
  }
  if (lower.includes('budget') || lower.includes('money') || lower.includes('spend')) {
    return "You've spent **¥18,400** so far (Day 2 of 9). Your daily budget is ¥8,500 and you're on track. Transport today: ¥620. Biggest upcoming cost: teamLab Planets at ¥3,200. You're ✅ looking good! 💰";
  }
  if (lower.includes('weather')) {
    return "Today in Tokyo: 18°C, partly cloudy with a slight breeze — perfect walking weather! 🌤️ Rain expected tomorrow afternoon, so your indoor Ghibli Museum visit is perfectly timed on Day 3.";
  }
  if (lower.includes('what should') || lower.includes('do now')) {
    return "It's mid-morning and you're near Shinjuku. Your next scheduled stop is Meiji Shrine (Day 2, 10:30 AM) — a 12-min walk north. Take the forest path, it's serene. Then Harajuku for lunch. Shall I show the route? 🧭";
  }
  return "Great question! Based on your itinerary and travel preferences, I'd suggest checking this out. Want me to add it to your plan or find alternatives nearby? ✈️";
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  proBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  proBadgeText: {
    fontSize: 11,
    letterSpacing: 0.8,
  },

  contextBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  contextEmoji: { fontSize: 14 },
  contextText: { fontSize: 14, flex: 1 },
  contextDayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  contextDayText: { fontSize: 12 },

  messagesList: {
    padding: 16,
    gap: 12,
    paddingBottom: 8,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
    gap: 8,
  },
  bubbleRowUser: {
    justifyContent: 'flex-end',
  },
  bubbleRowAI: {
    justifyContent: 'flex-start',
  },
  aiBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  aiBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  bubbleUser: {
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTime: {
    fontSize: 10,
    opacity: 0.6,
    alignSelf: 'flex-end',
  },

  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  typingText: {
    fontSize: 14,
  },

  quickActions: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickActionEmoji: { fontSize: 14 },
  quickActionLabel: { fontSize: 13 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    maxHeight: 120,
    lineHeight: 21,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnIcon: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },

  // Premium gate
  gateContainer: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  gateIcon: {
    fontSize: 56,
    marginBottom: 8,
  },
  gateTitle: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  gateBody: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  gateBullets: {
    width: '100%',
    gap: 8,
    marginBottom: 12,
  },
  gateBulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gateBulletDot: {
    fontSize: 15,
    fontWeight: '700',
  },
  gateBulletText: {
    fontSize: 15,
  },
  gateBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  gateBtnText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  gatePricing: {
    fontSize: 12,
    textAlign: 'center',
  },
});
