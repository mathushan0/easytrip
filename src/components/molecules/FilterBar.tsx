import React from 'react';
import {
  ScrollView,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { Chip } from '../atoms/Chip';
import { useTheme } from '@theme/useTheme';

export interface FilterOption {
  id: string;
  label: string;
  icon?: string;
}

export interface FilterBarProps {
  options: FilterOption[];
  selected: string[];
  onSelect: (id: string) => void;
  multiSelect?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

export function FilterBar({
  options,
  selected,
  onSelect,
  multiSelect = false,
  style,
  contentContainerStyle,
}: FilterBarProps): React.ReactElement {
  const { theme } = useTheme();

  const handleSelect = (id: string) => {
    if (!multiSelect) {
      // For single select: deselect if already selected, else select
      onSelect(id);
      return;
    }
    onSelect(id);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, contentContainerStyle]}
      style={style}
    >
      {options.map((opt) => (
        <Chip
          key={opt.id}
          label={opt.icon ? `${opt.icon} ${opt.label}` : opt.label}
          selected={selected.includes(opt.id)}
          onPress={() => handleSelect(opt.id)}
          size="md"
          style={styles.chip}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  chip: {
    flexShrink: 0,
  },
});
