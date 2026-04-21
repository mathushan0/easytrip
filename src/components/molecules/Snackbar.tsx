import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react-native';
import { useTheme } from '@theme/useTheme';
import type { ToastType } from '@stores/uiStore';

export interface SnackbarProps {
  message: string;
  type?: ToastType;
  durationMs?: number;
  onDismiss?: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
}

const ICON_MAP: Record<ToastType, React.ComponentType<{ size: number; color: string }>> = {
  success: CheckCircle2,
  error:   AlertCircle,
  warning: AlertTriangle,
  info:    Info,
};

export function Snackbar({
  message,
  type = 'info',
  durationMs = 4000,
  onDismiss,
  action,
}: SnackbarProps): React.ReactElement {
  const { theme } = useTheme();
  const translateY = useSharedValue(80);
  const opacity = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const typeColour: Record<ToastType, string> = {
    success: theme.system_success,
    error:   theme.system_error,
    warning: theme.system_warning,
    info:    theme.system_info,
  };

  const colour = typeColour[type];
  const IconComponent = ICON_MAP[type];

  const dismiss = () => {
    translateY.value = withTiming(80, { duration: 200 });
    opacity.value = withTiming(0, { duration: 200 }, () => {
      if (onDismiss) runOnJS(onDismiss)();
    });
  };

  useEffect(() => {
    // Animate in
    translateY.value = withSpring(0, { damping: 18, stiffness: 250 });
    opacity.value = withTiming(1, { duration: 200 });

    // Auto-dismiss
    if (durationMs > 0) {
      timerRef.current = setTimeout(dismiss, durationMs);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.snackbar,
        {
          backgroundColor: theme.bg_raised,
          borderColor: colour,
          borderLeftWidth: 3,
          borderRadius: theme.radius_md,
        },
        animStyle,
      ]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <View style={[styles.dot, { backgroundColor: colour }]} />
      <IconComponent size={16} color={colour} />
      <Text
        style={[
          styles.message,
          { fontFamily: theme.font_body, color: theme.text_primary },
        ]}
        numberOfLines={2}
      >
        {message}
      </Text>
      {action ? (
        <TouchableOpacity
          onPress={() => {
            action.onPress();
            dismiss();
          }}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          style={styles.actionBtn}
        >
          <Text
            style={[
              styles.actionLabel,
              { fontFamily: theme.font_body_medium, color: colour },
            ]}
          >
            {action.label}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={dismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          style={styles.closeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={14} color={theme.text_disabled} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  snackbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    marginHorizontal: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  actionBtn: {
    flexShrink: 0,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  closeBtn: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
