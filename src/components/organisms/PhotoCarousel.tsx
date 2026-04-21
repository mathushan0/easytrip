import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Modal,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@theme/useTheme';
import type { VenuePhoto } from '@/types';

export interface PhotoCarouselProps {
  photos: VenuePhoto[];
  height?: number;
  style?: ViewStyle;
  showAttribution?: boolean;
}

export function PhotoCarousel({
  photos,
  height = 240,
  style,
  showAttribution = true,
}: PhotoCarouselProps): React.ReactElement {
  const { theme } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const handleScroll = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
      setActiveIndex(index);
    },
    [screenWidth]
  );

  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(photos.length - 1, index));
      scrollRef.current?.scrollTo({ x: clamped * screenWidth, animated: true });
      setActiveIndex(clamped);
    },
    [photos.length, screenWidth]
  );

  if (photos.length === 0) {
    return (
      <View
        style={[
          styles.placeholder,
          { height, backgroundColor: theme.bg_raised },
          style,
        ]}
      >
        <Text style={[styles.placeholderText, { color: theme.text_disabled }]}>
          No photos available
        </Text>
      </View>
    );
  }

  return (
    <>
      <View style={[{ height }, style]}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
          accessibilityRole="scrollbar"
          accessibilityLabel={`Photo carousel. ${photos.length} photos.`}
        >
          {photos.map((photo, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setFullscreenOpen(true)}
              onLongPress={() => setFullscreenOpen(true)}
              activeOpacity={0.95}
              style={{ width: screenWidth }}
              accessibilityRole="image"
              accessibilityLabel={`Photo ${i + 1} of ${photos.length}`}
            >
              <Image
                source={{ uri: photo.url }}
                style={{ width: screenWidth, height }}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Dot indicators */}
        {photos.length > 1 ? (
          <View style={styles.dotsRow} pointerEvents="none">
            {photos.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      i === activeIndex
                        ? '#FFFFFF'
                        : 'rgba(255,255,255,0.4)',
                    width: i === activeIndex ? 16 : 6,
                  },
                ]}
              />
            ))}
          </View>
        ) : null}

        {/* Attribution */}
        {showAttribution && photos[activeIndex]?.attribution ? (
          <Text
            style={[
              styles.attribution,
              { fontFamily: theme.font_mono, color: 'rgba(255,255,255,0.6)' },
            ]}
            numberOfLines={1}
          >
            © {photos[activeIndex].attribution}
          </Text>
        ) : null}
      </View>

      {/* Fullscreen modal */}
      <Modal
        visible={fullscreenOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenOpen(false)}
        statusBarTranslucent
      >
        <View
          style={[
            styles.fullscreenContainer,
            { backgroundColor: '#000', paddingTop: insets.top },
          ]}
        >
          <TouchableOpacity
            style={[styles.fsClose, { top: insets.top + 8 }]}
            onPress={() => setFullscreenOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Close fullscreen"
          >
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: activeIndex * screenWidth, y: 0 }}
          >
            {photos.map((photo, i) => (
              <View
                key={i}
                style={{ width: screenWidth, justifyContent: 'center' }}
              >
                <Image
                  source={{ uri: photo.url }}
                  style={{ width: screenWidth, height: '80%' }}
                  resizeMode="contain"
                  accessibilityLabel={`Photo ${i + 1} of ${photos.length}`}
                />
              </View>
            ))}
          </ScrollView>

          <Text
            style={[
              styles.fsCounter,
              { fontFamily: theme.font_mono, color: 'rgba(255,255,255,0.7)' },
            ]}
          >
            {activeIndex + 1} / {photos.length}
          </Text>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 14,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    transition: 'width 200ms',
  },
  attribution: {
    position: 'absolute',
    bottom: 4,
    right: 8,
    fontSize: 9,
    letterSpacing: 0.3,
  },
  fullscreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fsClose: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fsCounter: {
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 16,
  },
});
