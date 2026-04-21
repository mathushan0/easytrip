import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@theme/useTheme';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: AvatarSize;
  style?: ViewStyle;
  showBorder?: boolean;
}

const SIZE_MAP: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 64,
  xl: 96,
};

export function Avatar({
  uri,
  name,
  size = 'md',
  style,
  showBorder = false,
}: AvatarProps): React.ReactElement {
  const { theme } = useTheme();
  const dim = SIZE_MAP[size];
  const fontSize = dim * 0.38;

  const initials = name
    ? name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : '?';

  const containerStyle: ViewStyle = {
    width: dim,
    height: dim,
    borderRadius: dim / 2,
    backgroundColor: theme.bg_raised,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...(showBorder && {
      borderWidth: 2,
      borderColor: theme.interactive_primary,
    }),
  };

  return (
    <View style={[containerStyle, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: dim, height: dim }}
          accessibilityLabel={name ?? 'User avatar'}
        />
      ) : (
        <Text
          style={[
            styles.initials,
            {
              fontFamily: theme.font_body_medium,
              color: theme.text_secondary,
              fontSize,
            },
          ]}
          accessibilityLabel={name ?? 'User avatar'}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  initials: {
    fontWeight: '600',
  },
});
