import React, { useState, forwardRef } from 'react';
import {
  TextInput as RNTextInput,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  type TextInputProps as RNTextInputProps,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@theme/useTheme';

export interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactElement;
  rightIcon?: React.ReactElement;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
}

export const TextInput = forwardRef<RNTextInput, TextInputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      onRightIconPress,
      containerStyle,
      inputStyle,
      onFocus,
      onBlur,
      ...rest
    },
    ref
  ) => {
    const { theme } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const borderAnim = useSharedValue(0);

    const animBorderStyle = useAnimatedStyle(() => ({
      borderColor: error
        ? theme.border_error
        : borderAnim.value === 1
        ? theme.border_focus
        : theme.border_default,
    }));

    const handleFocus: RNTextInputProps['onFocus'] = (e) => {
      setIsFocused(true);
      borderAnim.value = withTiming(1, { duration: 150 });
      onFocus?.(e);
    };

    const handleBlur: RNTextInputProps['onBlur'] = (e) => {
      setIsFocused(false);
      borderAnim.value = withTiming(0, { duration: 150 });
      onBlur?.(e);
    };

    return (
      <View style={[styles.wrapper, containerStyle]}>
        {label ? (
          <Text
            style={[
              styles.label,
              {
                fontFamily: theme.font_mono,
                color: error ? theme.system_error : theme.text_secondary,
                fontSize: 11,
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 6,
              },
            ]}
          >
            {label}
          </Text>
        ) : null}

        <Animated.View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.bg_surface,
              borderRadius: theme.radius_md,
            },
            animBorderStyle,
            { borderWidth: 1 },
            inputStyle,
          ]}
        >
          {leftIcon ? (
            <View style={styles.leftIcon}>{leftIcon}</View>
          ) : null}

          <RNTextInput
            ref={ref}
            style={[
              styles.input,
              {
                fontFamily: theme.font_body,
                color: theme.text_primary,
                fontSize: 16,
              },
            ]}
            placeholderTextColor={theme.text_disabled}
            onFocus={handleFocus}
            onBlur={handleBlur}
            selectionColor={theme.brand_cyan}
            {...rest}
          />

          {rightIcon ? (
            <TouchableOpacity
              onPress={onRightIconPress}
              style={styles.rightIcon}
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {rightIcon}
            </TouchableOpacity>
          ) : null}
        </Animated.View>

        {error ? (
          <Text
            style={[
              styles.helperText,
              {
                fontFamily: theme.font_body,
                color: theme.system_error,
              },
            ]}
            accessibilityLiveRegion="polite"
          >
            {error}
          </Text>
        ) : hint ? (
          <Text
            style={[
              styles.helperText,
              {
                fontFamily: theme.font_body,
                color: theme.text_secondary,
              },
            ]}
          >
            {hint}
          </Text>
        ) : null}
      </View>
    );
  }
);

TextInput.displayName = 'TextInput';

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  label: {},
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
  },
  leftIcon: {
    marginRight: 10,
  },
  rightIcon: {
    marginLeft: 10,
  },
  helperText: {
    fontSize: 13,
    marginTop: 4,
    marginLeft: 2,
  },
});
