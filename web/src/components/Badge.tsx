import React from 'react';
import clsx from 'clsx';

/**
 * Badge Component
 * LIKBadge (44px / 72px), all 4 theme variants
 */

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  theme?: 'bubbly' | 'aurora' | 'warm_sand' | 'electric';
  icon?: React.ReactNode;
  animate?: boolean;
}

const themeStyles = {
  'bubbly': clsx(
    'bg-gradient-to-br from-yellow-300 via-red-400 to-pink-400',
    'text-white',
    'shadow-lg'
  ),
  'aurora': clsx(
    'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500',
    'text-white',
    'shadow-lg'
  ),
  'warm_sand': clsx(
    'bg-gradient-to-br from-yellow-600 via-orange-500 to-red-500',
    'text-white',
    'shadow-lg'
  ),
  'electric': clsx(
    'bg-gradient-to-br from-cyan-400 via-blue-500 to-pink-600',
    'text-white',
    'shadow-neon-glow'
  ),
};

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      size = 'md',
      theme = 'bubbly',
      icon,
      animate = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      'sm': 'w-11 h-11',
      'md': 'w-16 h-16',
      'lg': 'w-20 h-20',
    }[size];

    const baseStyles = clsx(
      // Base
      sizeClasses,
      'rounded-full',
      'flex items-center justify-center',
      'font-fredoka font-bold',
      'transition-smooth',

      // Theme
      themeStyles[theme],

      // Animation
      animate && 'animate-pulse-soft',

      className
    );

    return (
      <div
        ref={ref}
        className={baseStyles}
        {...props}
      >
        {icon ? (
          <span className="text-2xl">{icon}</span>
        ) : (
          <span className="text-center text-sm md:text-base">
            {children}
          </span>
        )}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
