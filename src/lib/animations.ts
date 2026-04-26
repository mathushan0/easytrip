/**
 * animations.ts — EasyTrip Animation Library
 *
 * All animations use React Native's Animated API.
 * Spring config uses cubic-bezier equivalent: bounciness 12 / speed 12
 * (.34 1.56 .64 1) feel throughout the app.
 */

import { Animated, Easing } from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// SPRING CONFIG — shared snap-back feel
// ─────────────────────────────────────────────────────────────────────────────

export const springConfig = {
  bounciness: 12,
  speed: 12,
} as const;

export const springConfigGentle = {
  bounciness: 6,
  speed: 14,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// CARD PRESS — neo-brutalist shadow shift on press
// Shadow moves from (4,4) → (2,2) giving "pressed into page" feel.
// Usage: interpolate a 0→1 Animated.Value against cardPressInterpolation.
// ─────────────────────────────────────────────────────────────────────────────

export const cardPressInterpolation = {
  translateX: {
    inputRange: [0, 1],
    outputRange: [0, 2],
  },
  translateY: {
    inputRange: [0, 1],
    outputRange: [0, 2],
  },
  shadowOpacity: {
    inputRange: [0, 1],
    outputRange: [1, 0.5],
  },
  elevation: {
    inputRange: [0, 1],
    outputRange: [4, 2],
  },
};

/**
 * Creates a press-in / press-out animation pair.
 * Returns { pressValue, onPressIn, onPressOut, animatedStyle }.
 */
export function createCardPressAnimation() {
  const pressValue = new Animated.Value(0);

  const onPressIn = () =>
    Animated.spring(pressValue, {
      toValue: 1,
      ...springConfig,
      useNativeDriver: false, // elevation not supported with native driver
    }).start();

  const onPressOut = () =>
    Animated.spring(pressValue, {
      toValue: 0,
      ...springConfig,
      useNativeDriver: false,
    }).start();

  const translateX = pressValue.interpolate(cardPressInterpolation.translateX);
  const translateY = pressValue.interpolate(cardPressInterpolation.translateY);

  return { pressValue, onPressIn, onPressOut, translateX, translateY };
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB BOUNCE — active tab pops up 6px, scales to 1.1
// Usage: createTabBounceAnimation(tabCount) → array of { translateY, scale }
// ─────────────────────────────────────────────────────────────────────────────

export function createTabBounceAnimation(tabCount: number) {
  const values = Array.from({ length: tabCount }, () => new Animated.Value(0));

  function activateTab(index: number) {
    values.forEach((val, i) => {
      Animated.spring(val, {
        toValue: i === index ? 1 : 0,
        ...springConfig,
        useNativeDriver: true,
      }).start();
    });
  }

  const styles = values.map((val) => ({
    translateY: val.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }),
    scale: val.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }),
  }));

  return { styles, activateTab };
}

// ─────────────────────────────────────────────────────────────────────────────
// WOBBLE — used on invalid tap / error feedback
// Returns { wobbleValue, triggerWobble }
// ─────────────────────────────────────────────────────────────────────────────

export function createWobbleAnimation() {
  const wobbleValue = new Animated.Value(0);

  const triggerWobble = () => {
    wobbleValue.setValue(0);
    Animated.sequence([
      Animated.timing(wobbleValue, { toValue: -5, duration: 60, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(wobbleValue, { toValue: 5,  duration: 60, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(wobbleValue, { toValue: -4, duration: 50, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(wobbleValue, { toValue: 4,  duration: 50, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(wobbleValue, { toValue: 0,  duration: 40, useNativeDriver: true, easing: Easing.linear }),
    ]).start();
  };

  const rotate = wobbleValue.interpolate({
    inputRange: [-5, 0, 5],
    outputRange: ['-5deg', '0deg', '5deg'],
  });

  return { wobbleValue, triggerWobble, rotate };
}

// ─────────────────────────────────────────────────────────────────────────────
// PULSE — looping opacity pulse for alert/badge dots
// Returns { pulseValue, startPulse, stopPulse }
// ─────────────────────────────────────────────────────────────────────────────

export function createPulseAnimation(duration = 2000) {
  const pulseValue = new Animated.Value(0.5);
  let animation: Animated.CompositeAnimation | null = null;

  const startPulse = () => {
    animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, { toValue: 1,   duration: duration / 2, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(pulseValue, { toValue: 0.5, duration: duration / 2, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    );
    animation.start();
  };

  const stopPulse = () => {
    animation?.stop();
    pulseValue.setValue(1);
  };

  return { pulseValue, startPulse, stopPulse };
}

// ─────────────────────────────────────────────────────────────────────────────
// FLOAT — gentle vertical float for splash screen plane / illustrations
// Returns { floatValue, startFloat, stopFloat }
// ─────────────────────────────────────────────────────────────────────────────

export function createFloatAnimation(amplitude = 10, duration = 3000) {
  const floatValue = new Animated.Value(0);
  let animation: Animated.CompositeAnimation | null = null;

  const startFloat = () => {
    animation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatValue, { toValue: -amplitude, duration: duration / 2, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(floatValue, { toValue: 0,          duration: duration / 2, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    );
    animation.start();
  };

  const stopFloat = () => {
    animation?.stop();
    floatValue.setValue(0);
  };

  return { floatValue, startFloat, stopFloat };
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFETTI PARTICLE — single particle animation for badge earned celebration
// Each particle: scale 0→1, opacity 1→0, translateY 0→-100
// Returns { scaleValue, opacityValue, translateYValue, startConfetti }
// ─────────────────────────────────────────────────────────────────────────────

export function createConfettiParticleAnimation(delay = 0, distance = 100) {
  const scaleValue     = new Animated.Value(0);
  const opacityValue   = new Animated.Value(1);
  const translateY     = new Animated.Value(0);

  const startConfetti = () => {
    scaleValue.setValue(0);
    opacityValue.setValue(1);
    translateY.setValue(0);

    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)),
      }),
      Animated.timing(opacityValue, {
        toValue: 0,
        duration: 800,
        delay: delay + 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -distance,
        duration: 800,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
    ]).start();
  };

  return { scaleValue, opacityValue, translateY, startConfetti };
}

/**
 * Creates a burst of confetti particles with staggered delays.
 * Returns array of particle animations + a single triggerBurst fn.
 */
export function createConfettiBurst(count = 12) {
  const particles = Array.from({ length: count }, (_, i) =>
    createConfettiParticleAnimation(i * 40, 80 + Math.random() * 60)
  );

  const triggerBurst = () => particles.forEach((p) => p.startConfetti());

  return { particles, triggerBurst };
}

// ─────────────────────────────────────────────────────────────────────────────
// FADE IN — generic fade-in for screen / modal entry
// ─────────────────────────────────────────────────────────────────────────────

export function createFadeInAnimation(duration = 300, delay = 0) {
  const opacity = new Animated.Value(0);

  const fadeIn = () =>
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();

  return { opacity, fadeIn };
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE UP — bottom sheet / modal entry
// ─────────────────────────────────────────────────────────────────────────────

export function createSlideUpAnimation(fromY = 60, duration = 350) {
  const translateY = new Animated.Value(fromY);
  const opacity    = new Animated.Value(0);

  const slideUp = () =>
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, ...springConfigGentle, useNativeDriver: true }),
      Animated.timing(opacity,    { toValue: 1, duration, useNativeDriver: true }),
    ]).start();

  const slideDown = (onDone?: () => void) =>
    Animated.parallel([
      Animated.timing(translateY, { toValue: fromY, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity,    { toValue: 0,      duration: 200, useNativeDriver: true }),
    ]).start(onDone);

  return { translateY, opacity, slideUp, slideDown };
}
