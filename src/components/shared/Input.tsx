// ─────────────────────────────────────────────────────────────────────────────
// SHARED — Input
// Rounded outline, 3px dark border, Nunito/Fredoka font
// Validation error state in red
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  TextInput as RNTextInput,
  View,
  Text,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@theme/useTheme';
import { FONT_FAMILIES } from '@theme/fonts';

export interface SharedInputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
  /** 'fredoka' for title-style inputs, 'nunito' (default) for body */
  fontVariant?: 'fredoka' | 'nunito';
}

export function Input({
  label,
  error,
  hint,
  containerStyle,
  fontVariant = 'nunito',
  style,
  ...rest
}: SharedInputProps): React.ReactElement {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);

  const fontFamily =
    fontVariant === 'fredoka'
      ? FONT_FAMILIES.fredokaMedium
      : FONT_FAMILIES.nunitoSemiBold;

  const borderColor = error
    ? theme.border_error
    : focused
    ? theme.border_focus
    : theme.border_default;

  return (
    <View style={containerStyle}>
      {label ? (
        <Text
          style={[
            styles.label,
            { color: theme.text_primary, fontFamily: FONT_FAMILIES.nunitoBold },
          ]}
        >
          {label}
        </Text>
      ) : null}

      <RNTextInput
        style={[
          styles.input,
          {
            borderColor,
            color: theme.text_primary,
            backgroundColor: theme.bg_surface,
            fontFamily,
          },
          style,
        ]}
        placeholderTextColor={theme.text_disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...rest}
      />

      {error ? (
        <Text style={[styles.error, { color: theme.system_error, fontFamily: FONT_FAMILIES.nunitoSemiBold }]}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={[styles.hint, { color: theme.text_secondary, fontFamily: FONT_FAMILIES.nunitoSemiBold }]}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    borderWidth: 3,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },
  error: {
    fontSize: 13,
    marginTop: 4,
  },
  hint: {
    fontSize: 13,
    marginTop: 4,
  },
});
