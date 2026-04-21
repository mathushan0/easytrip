import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@theme/useTheme';
import type { ProfileStackParamList } from '@/types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();
const PlaceholderScreen = (): null => null;

export function ProfileStackNavigator(): React.ReactElement {
  const { theme } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.bg_primary },
        animation: 'ios_from_right',
      }}
    >
      <Stack.Screen name="ProfileScreen" component={PlaceholderScreen} />
      <Stack.Screen name="Settings"      component={PlaceholderScreen} />
    </Stack.Navigator>
  );
}
