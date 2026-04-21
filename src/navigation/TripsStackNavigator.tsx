import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@theme/useTheme';
import type { TripsStackParamList } from '@/types';

const Stack = createNativeStackNavigator<TripsStackParamList>();

const PlaceholderScreen = (): null => null;

export function TripsStackNavigator(): React.ReactElement {
  const { theme } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.bg_primary },
        animation: 'ios_from_right',
      }}
    >
      <Stack.Screen name="TripsScreen" component={PlaceholderScreen} />
      <Stack.Screen name="TripDetail"  component={PlaceholderScreen} />
      <Stack.Screen name="DayPlanner"  component={PlaceholderScreen} />
    </Stack.Navigator>
  );
}
