import React, { useCallback, forwardRef, type PropsWithChildren } from 'react';
import { StyleSheet, View, Text, type ViewStyle } from 'react-native';
import GorhomBottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetProps as GorhomProps,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useTheme } from '@theme/useTheme';

export interface BottomSheetProps extends Omit<GorhomProps, 'children' | 'backgroundStyle'> {
  title?: string;
  subtitle?: string;
  scrollable?: boolean;
  contentContainerStyle?: ViewStyle;
  children?: React.ReactNode;
}

export const BottomSheet = forwardRef<GorhomBottomSheet, BottomSheetProps>(
  (
    {
      title,
      subtitle,
      scrollable = false,
      contentContainerStyle,
      children,
      snapPoints = ['50%'],
      ...rest
    },
    ref
  ) => {
    const { theme } = useTheme();

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.55}
        />
      ),
      []
    );

    const ContentWrapper = scrollable ? BottomSheetScrollView : BottomSheetView;

    return (
      <GorhomBottomSheet
        ref={ref}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{
          backgroundColor: theme.border_default,
          width: 36,
          height: 4,
        }}
        backgroundStyle={{
          backgroundColor: theme.bg_surface,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
        enablePanDownToClose
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        {...rest}
      >
        <ContentWrapper
          contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
        >
          {(title || subtitle) ? (
            <View style={styles.header}>
              {title ? (
                <Text
                  style={[
                    styles.title,
                    { fontFamily: theme.font_display, color: theme.text_primary },
                  ]}
                >
                  {title}
                </Text>
              ) : null}
              {subtitle ? (
                <Text
                  style={[
                    styles.subtitle,
                    { fontFamily: theme.font_body, color: theme.text_secondary },
                  ]}
                >
                  {subtitle}
                </Text>
              ) : null}
            </View>
          ) : null}
          {children}
        </ContentWrapper>
      </GorhomBottomSheet>
    );
  }
);

BottomSheet.displayName = 'BottomSheet';

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  header: {
    paddingVertical: 12,
    gap: 4,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
});
