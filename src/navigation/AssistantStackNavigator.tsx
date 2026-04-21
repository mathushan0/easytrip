import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@theme/useTheme';

type AssistantStackParamList = {
  AssistantScreen: undefined;
};

const Stack = createNativeStackNavigator<AssistantStackParamList>();
const PlaceholderScreen = (): null => null;

export function AssistantStackNavigator(): React.ReactElement {
  const { theme } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.bg_primary },
      }}
    >
      <Stack.Screen name="AssistantScreen" component={PlaceholderScreen} />
    </Stack.Navigator>
  );
}
