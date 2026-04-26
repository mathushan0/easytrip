// ─────────────────────────────────────────────────────────────────────────────
// BOTTOM TAB NAV
// Yellow floating pill, 20px above bottom, not docked
// 5 tabs: Home, Saved, Plan, Favourites, Chat
// Each icon: 48x48 coloured square, 4px dark border, 3px shadow
// Active tab: bounces -6px spring, Mint Green label below
// Inactive tabs: no label
// All tabs wobble on tap
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/useTheme';
import { FONT_FAMILIES } from '@theme/fonts';

// Screen placeholders — replaced by actual navigators in RootNavigator
import { HomeStackNavigator } from './HomeStackNavigator';
import { TripsStackNavigator } from './TripsStackNavigator';
import { AssistantStackNavigator } from './AssistantStackNavigator';
import { ProfileStackNavigator } from './ProfileStackNavigator';

const Tab = createBottomTabNavigator();

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = [
  { name: 'Home',        emoji: '🏠', bg: '#56CCF2', label: 'Home'      },
  { name: 'Saved',       emoji: '🔖', bg: '#FFD93D', label: 'Saved'     },
  { name: 'Plan',        emoji: '✈️', bg: '#FF6B6B', label: 'Plan'      },
  { name: 'Favourites',  emoji: '❤️', bg: '#C7A7FF', label: 'Favourites'},
  { name: 'Chat',        emoji: '💬', bg: '#FFFFFF', label: 'Chat'      },
] as const;

// ─── Single tab icon ──────────────────────────────────────────────────────────

interface TabIconProps {
  emoji: string;
  bg: string;
  label: string;
  active: boolean;
  onPress: () => void;
}

function TabIcon({ emoji, bg, label, active, onPress }: TabIconProps): React.ReactElement {
  const { theme } = useTheme();
  const translateY = useSharedValue(0);
  const rotateZ = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotateZ: `${rotateZ.value}deg` },
    ],
  }));

  const handlePress = useCallback(() => {
    // Wobble animation
    rotateZ.value = withSequence(
      withSpring(-8, { damping: 5, stiffness: 400 }),
      withSpring(8, { damping: 5, stiffness: 400 }),
      withSpring(0, { damping: 8, stiffness: 300 }),
    );
    // Bounce up if becoming active
    if (!active) {
      translateY.value = withSpring(-6, { damping: 8, stiffness: 300 });
      setTimeout(() => {
        translateY.value = withSpring(0, { damping: 8, stiffness: 200 });
      }, 200);
    }
    onPress();
  }, [active, onPress, rotateZ, translateY]);

  // Active: stay bounced -6px
  React.useEffect(() => {
    translateY.value = withSpring(active ? -6 : 0, { damping: 10, stiffness: 200 });
  }, [active, translateY]);

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1} style={styles.tabBtn}>
      <Animated.View style={animStyle}>
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: bg,
              borderColor: theme.text_primary,
            },
          ]}
        >
          <Text style={styles.iconEmoji}>{emoji}</Text>
        </View>
      </Animated.View>
      {active ? (
        <Text
          style={[
            styles.activeLabel,
            {
              fontFamily: FONT_FAMILIES.nunitoBold,
              color: '#4ECDC4', // Mint Green
            },
          ]}
        >
          {label}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

// ─── Custom tab bar ───────────────────────────────────────────────────────────

function FloatingTabBar({ state, navigation }: {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void; emit: (e: { type: string; target: string; canPreventDefault: boolean }) => { defaultPrevented: boolean } };
}): React.ReactElement {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.pillWrapper,
        {
          bottom: Math.max(insets.bottom, 0) + 20,
        },
      ]}
    >
      <View
        style={[
          styles.pill,
          {
            backgroundColor: '#FFD93D',
            borderColor: theme.text_primary,
          },
        ]}
      >
        {TABS.map((tab, i) => {
          const active = state.index === i;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: state.routes[i].key,
              canPreventDefault: true,
            });
            if (!active && !event.defaultPrevented) {
              navigation.navigate(tab.name);
            }
          };

          return (
            <TabIcon
              key={tab.name}
              emoji={tab.emoji}
              bg={tab.bg}
              label={tab.label}
              active={active}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

// ─── Placeholder screens ──────────────────────────────────────────────────────

const PlaceholderScreen = (): null => null;

// ─── Navigator ────────────────────────────────────────────────────────────────

export function BottomTabNav(): React.ReactElement {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...(props as unknown as Parameters<typeof FloatingTabBar>[0])} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Saved" component={TripsStackNavigator} />
      <Tab.Screen name="Plan" component={PlaceholderScreen} />
      <Tab.Screen name="Favourites" component={PlaceholderScreen} />
      <Tab.Screen name="Chat" component={AssistantStackNavigator} />
    </Tab.Navigator>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pillWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 200,
  },
  pill: {
    flexDirection: 'row',
    borderRadius: 999,
    borderWidth: 3,
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    alignItems: 'flex-end',
  },
  tabBtn: {
    alignItems: 'center',
    gap: 4,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 3,
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 22,
  },
  activeLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
});
