/**
 * animations.ts — EasyTrip Web Animation Utilities
 * CSS-based animations with Tailwind integration
 * Spring timing functions using cubic-bezier
 */

// Spring timing function (cubic-bezier equivalent)
export const springTiming = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
export const springTimingGentle = 'cubic-bezier(0.34, 1.2, 0.64, 1)';

// Predefined animation classes
export const animations = {
  // Card press (shadow reduction)
  cardPress: {
    className: 'active:scale-95 active:shadow-flat-md transition-all duration-200',
  },

  // Card hover (lift effect)
  cardHover: {
    className: 'hover:shadow-lift-lg hover:-translate-y-1 transition-all duration-300',
  },

  // Tab bounce (pop up, scale)
  tabBounce: {
    className: 'animate-tab-bounce',
  },

  // Button hover (scale and shadow)
  buttonHover: {
    className: 'hover:scale-105 hover:shadow-lift-md active:scale-95 transition-all duration-200',
  },

  // Pulse effect
  pulse: {
    className: 'animate-pulse-soft',
  },

  // Fade in
  fadeIn: {
    className: 'animate-in fade-in duration-300',
  },

  // Slide up
  slideUp: {
    className: 'animate-in slide-in-from-bottom-4 duration-300',
  },

  // Wobble (error feedback)
  wobble: {
    className: 'animate-wobble',
  },

  // Smooth transition
  smooth: {
    className: 'transition-smooth',
  },
};

// CSS animation keyframes (can be used in global styles)
export const keyframes = `
  @keyframes tab-bounce {
    0% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-6px) scale(1.1); }
    100% { transform: translateY(0) scale(1); }
  }

  @keyframes card-lift {
    from { transform: translateY(0); box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12); }
    to { transform: translateY(-4px); box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15); }
  }

  @keyframes pulse-soft {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }

  @keyframes wobble {
    0% { transform: translateX(0deg); }
    15% { transform: translateX(-5px) rotate(-5deg); }
    30% { transform: translateX(5px) rotate(5deg); }
    45% { transform: translateX(-4px) rotate(-4deg); }
    60% { transform: translateX(4px) rotate(4deg); }
    100% { transform: translateX(0deg) rotate(0deg); }
  }

  @keyframes confetti-burst {
    0% { transform: scale(0) translateY(0); opacity: 1; }
    100% { transform: scale(1) translateY(-100px); opacity: 0; }
  }
`;

// Timing utilities
export const timingValues = {
  fast: 200,
  normal: 300,
  slow: 500,
  verySlow: 800,
};

/**
 * Utility to generate inline animation style
 */
export function getAnimationStyle(duration: number = 300) {
  return {
    transition: `all ${duration}ms ${springTiming}`,
  };
}

/**
 * Generate a CSS animation rule
 */
export function createAnimation(
  name: string,
  frames: Record<string, Record<string, string>>
) {
  const keyframeStr = Object.entries(frames)
    .map(([key, props]) => {
      const propStr = Object.entries(props)
        .map(([k, v]) => `${k}: ${v};`)
        .join(' ');
      return `${key} { ${propStr} }`;
    })
    .join('\n');

  return `@keyframes ${name} { ${keyframeStr} }`;
}

/**
 * Spring animation helper
 */
export function springAnimate(
  element: HTMLElement,
  props: Record<string, number>,
  duration: number = 400
) {
  return new Promise<void>((resolve) => {
    Object.assign(element.style, {
      transition: `all ${duration}ms ${springTiming}`,
    });

    // Trigger animation
    requestAnimationFrame(() => {
      Object.entries(props).forEach(([key, value]) => {
        const cssKey = key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
        element.style.setProperty(cssKey, `${value}px`);
      });

      // Cleanup after animation
      setTimeout(() => {
        element.style.transition = '';
        resolve();
      }, duration);
    });
  });
}

/**
 * Confetti burst effect
 */
export function triggerConfetti(element: HTMLElement, count: number = 12) {
  const particles: HTMLElement[] = [];

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.style.position = 'fixed';
    particle.style.pointerEvents = 'none';
    particle.style.width = '8px';
    particle.style.height = '8px';
    particle.style.borderRadius = '50%';
    particle.style.left = element.offsetLeft + element.offsetWidth / 2 + 'px';
    particle.style.top = element.offsetTop + element.offsetHeight / 2 + 'px';
    particle.style.backgroundColor = ['#FF6B6B', '#FFD93D', '#4DABF7', '#63E6BE', '#DA77F2'][
      i % 5
    ];
    particle.style.animation = `confetti-burst 0.8s ease-out ${(i * 40) / 1000}s`;

    document.body.appendChild(particle);
    particles.push(particle);
  }

  // Cleanup
  setTimeout(() => {
    particles.forEach((p) => p.remove());
  }, 1200);
}
