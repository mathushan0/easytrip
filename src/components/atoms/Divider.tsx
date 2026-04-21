import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '@theme/useTheme';

export interface DividerProps {
  label?: string;
  style?: ViewStyle;
  thickness?: number;
}

export function Divider({
  label,
  style,
  thickness = StyleSheet.hairlineWidth,
}: DividerProps): React.ReactElement {
  const { theme } = useTheme();

  if (label) {
    return (
      <View style={[styles.row, style]}>
        <View
          style={[
            styles.line,
            { backgroundColor: theme.border_default, height: thickness },
          ]}
        />
        <Text
          style={[
            styles.label,
            {
              fontFamily: theme.font_mono,
              color: theme.text_disabled,
            },
          ]}
        >
          {label}
        </Text>
        <View
          style={[
            styles.line,
            { backgroundColor: theme.border_default, height: thickness },
          ]}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        {
          height: thickness,
          backgroundColor: theme.border_default,
          width: '100%',
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  line: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
