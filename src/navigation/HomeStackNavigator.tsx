import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@theme/useTheme';
import type { HomeStackParamList } from '@/types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

const PlaceholderScreen = (): null => null;

export function HomeStackNavigator(): React.ReactElement {
  const { theme } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.bg_primary },
        animation: 'ios_from_right',
      }}
    >
      <Stack.Screen name="HomeScreen" component={PlaceholderScreen} />
    </Stack.Navigator>
  );
}
