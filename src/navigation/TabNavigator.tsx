import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from '@react-native-community/blur';
import {
  Home,
  Plane,
  Plus,
  MessageCircle,
  User,
} from 'lucide-react-native';
import { useTheme } from '@theme/useTheme';
import type { TabParamList } from '@/types';
import { HomeStackNavigator } from './HomeStackNavigator';
import { TripsStackNavigator } from './TripsStackNavigator';
import { AssistantStackNavigator } from './AssistantStackNavigator';
import { ProfileStackNavigator } from './ProfileStackNavigator';
import { useEntitlements } from '@stores/userStore';
import { useShowUpsell } from '@stores/uiStore';
import { useTabBarVisible } from './hooks';

const Tab = createBottomTabNavigator<TabParamList>();

// Placeholder navigator for screens built in Run 2
const PlaceholderNavigator = (): React.ReactElement | null => null;

// ─── Create Screen (centre FAB) ───────────────────────────────────────────────

// Placeholder — actual trip creator will be a modal stack in Run 2
const CreatePlaceholder = (): null => null;

// ─── Tab Bar ──────────────────────────────────────────────────────────────────

interface CustomTabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  descriptors: Record<string, { options: { tabBarLabel?: string; tabBarAccessibilityLabel?: string } }>;
  navigation: {
    navigate: (name: string) => void;
    emit: (event: { type: string; target: string; canPreventDefault: boolean }) => { defaultPrevented: boolean };
  };
}

function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps): React.ReactElement {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const entitlements = useEntitlements();
  const showUpsell = useShowUpsell();

  const TAB_HEIGHT = 60;
  const bottomPadding = Math.max(insets.bottom, 8);

  const TABS = [
    { name: 'Home',      icon: Home,          label: 'Home'    },
    { name: 'Trips',     icon: Plane,         label: 'Trips'   },
    { name: 'Create',    icon: Plus,          label: null      }, // FAB
    { name: 'Assistant', icon: MessageCircle, label: 'AI'      },
    { name: 'Profile',   icon: User,          label: 'Profile' },
  ] as const;

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          height: TAB_HEIGHT + bottomPadding,
          paddingBottom: bottomPadding,
          borderTopColor: theme.border_default,
        },
      ]}
    >
      {/* Glass background */}
      {Platform.OS === 'ios' ? (
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={12}
        />
      ) : (
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: theme.bg_surface }]}
        />
      )}

      <View style={styles.tabBar}>
        {TABS.map((tab, index) => {
          const route = state.routes[index];
          const isFocused = state.index === index;
          const isFab = tab.name === 'Create';

          const onPress = () => {
            // AI Assistant gate
            if (tab.name === 'Assistant' && !entitlements.hasAiAssistant) {
              showUpsell('ai_assistant');
              return;
            }

            if (!route) return;

            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(tab.name);
            }
          };

          if (isFab) {
            return (
              <TouchableOpacity
                key={tab.name}
                onPress={onPress}
                style={[
                  styles.fabButton,
                  { backgroundColor: theme.interactive_primary },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Create new trip"
                accessibilityHint="Opens the trip creator"
              >
                <Plus size={28} color={theme.text_inverse} strokeWidth={2.5} />
              </TouchableOpacity>
            );
          }

          const IconComponent = tab.icon;
          const isLocked =
            tab.name === 'Assistant' && !entitlements.hasAiAssistant;

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={onPress}
              style={styles.tabItem}
              accessibilityRole="button"
              accessibilityLabel={
                descriptors[route?.key ?? '']?.options.tabBarAccessibilityLabel ??
                tab.label ?? tab.name
              }
              accessibilityState={{ selected: isFocused }}
            >
              <IconComponent
                size={24}
                color={
                  isFocused
                    ? theme.interactive_primary
                    : isLocked
                    ? theme.text_disabled
                    : theme.text_secondary
                }
                strokeWidth={isFocused ? 2 : 1.5}
              />
              {tab.label ? (
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      fontFamily: theme.font_mono,
                      color: isFocused
                        ? theme.interactive_primary
                        : isLocked
                        ? theme.text_disabled
                        : theme.text_secondary,
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              ) : null}
              {isFocused ? (
                <View
                  style={[
                    styles.activeIndicator,
                    { backgroundColor: theme.interactive_primary },
                  ]}
                />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── TabNavigator ─────────────────────────────────────────────────────────────

export function TabNavigator(): React.ReactElement {
  const { theme } = useTheme();
  const tabBarVisible = useTabBarVisible();

  return (
    <Tab.Navigator
      tabBar={(props) => tabBarVisible ? (
        <CustomTabBar
          state={props.state}
          descriptors={props.descriptors as CustomTabBarProps['descriptors']}
          navigation={props.navigation as unknown as CustomTabBarProps['navigation']}
        />
      ) : null}
      screenOptions={{
        headerShown: false,
        lazy: true,
        tabBarStyle: {
          backgroundColor: theme.bg_surface,
          borderTopColor: theme.border_default,
        },
      }}
    >
      <Tab.Screen name="Home"      component={HomeStackNavigator} />
      <Tab.Screen name="Trips"     component={TripsStackNavigator} />
      <Tab.Screen name="Create"    component={CreatePlaceholder as unknown as React.ComponentType} />
      <Tab.Screen name="Assistant" component={AssistantStackNavigator} />
      <Tab.Screen name="Profile"   component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  tabBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    minHeight: 44,
    minWidth: 44,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -6,
    width: 8,
    height: 2,
    borderRadius: 1,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
