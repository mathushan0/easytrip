import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@theme/useTheme';
import { Button } from '../atoms/Button';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  body?: string;
  cta?: {
    label: string;
    onPress: () => void;
  };
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  title,
  body,
  cta,
  style,
}: EmptyStateProps): React.ReactElement {
  const { theme } = useTheme();

  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="none"
    >
      {icon ? (
        <Text style={styles.icon} accessibilityElementsHidden>
          {icon}
        </Text>
      ) : null}

      <Text
        style={[
          styles.title,
          { fontFamily: theme.font_display, color: theme.text_primary },
        ]}
      >
        {title}
      </Text>

      {body ? (
        <Text
          style={[
            styles.body,
            { fontFamily: theme.font_body, color: theme.text_secondary },
          ]}
        >
          {body}
        </Text>
      ) : null}

      {cta ? (
        <Button
          label={cta.label}
          onPress={cta.onPress}
          variant="primary"
          size="md"
          style={styles.cta}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  icon: {
    fontSize: 56,
    lineHeight: 72,
    textAlign: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 26,
  },
  body: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  cta: {
    marginTop: 8,
  },
});
