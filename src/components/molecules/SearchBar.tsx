import React, { forwardRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  type ViewStyle,
  type TextInput as RNTextInput,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import { TextInput, type TextInputProps } from '../atoms/TextInput';
import { useTheme } from '@theme/useTheme';

export interface SearchBarProps
  extends Omit<TextInputProps, 'leftIcon' | 'rightIcon' | 'onRightIconPress'> {
  onClear?: () => void;
  containerStyle?: ViewStyle;
}

export const SearchBar = forwardRef<RNTextInput, SearchBarProps>(
  ({ value, onClear, containerStyle, ...rest }, ref) => {
    const { theme } = useTheme();

    return (
      <TextInput
        ref={ref}
        value={value}
        leftIcon={<Search size={18} color={theme.text_secondary} />}
        rightIcon={
          value ? <X size={18} color={theme.text_secondary} /> : undefined
        }
        onRightIconPress={onClear}
        containerStyle={containerStyle}
        returnKeyType="search"
        clearButtonMode="never" // handled manually
        accessibilityRole="search"
        {...rest}
      />
    );
  }
);

SearchBar.displayName = 'SearchBar';
