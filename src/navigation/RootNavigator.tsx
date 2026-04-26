import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useIsAuthenticated } from '@stores/userStore';
import { useTheme } from '@theme/useTheme';
import type { RootStackParamList } from '@/types';

// Screen imports (screens built in Run 2)
// Using lazy placeholders that will be replaced
const OnboardingScreen = React.lazy(() =>
  import('@screens/OnboardingScreen').catch(() => ({
    default: () => null as unknown as React.ReactElement,
  }))
);

import { TabNavigator } from './TabNavigator';
import { SplashScreen } from '@screens/SplashScreen';
import { ConsentScreen } from '@screens/ConsentScreen';
import { SignInScreen } from '@screens/SignInScreen';
import { ProfileSetupScreen } from '@screens/ProfileSetupScreen';

// ─── Placeholder screens for Run 1 ───────────────────────────────────────────

const PlaceholderScreen = (): React.ReactElement | null => null;

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator(): React.ReactElement {
  const isAuthenticated = useIsAuthenticated();
  const { theme } = useTheme();

  return (
    <NavigationContainer
      theme={{
        dark: theme.bg_primary === '#09090B' || theme.bg_primary === '#090b12' || theme.bg_primary === '#080808',
        colors: {
          primary: theme.interactive_primary,
          background: theme.bg_primary,
          card: theme.bg_surface,
          text: theme.text_primary,
          border: theme.border_default,
          notification: theme.brand_coral,
        },
        fonts: {
          regular: { fontFamily: theme.font_body, fontWeight: '400' },
          medium: { fontFamily: theme.font_body_medium, fontWeight: '500' },
          bold: { fontFamily: theme.font_display, fontWeight: '800' },
          heavy: { fontFamily: theme.font_display, fontWeight: '800' },
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'ios_from_right',
          contentStyle: { backgroundColor: theme.bg_primary },
        }}
      >
        {!isAuthenticated ? (
          // Auth screens
          <Stack.Group>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Consent" component={ConsentScreen} />
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="SignUp" component={PlaceholderScreen} />
            <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
          </Stack.Group>
        ) : (
          // Authenticated screens
          <Stack.Group>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Main" component={TabNavigator} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
