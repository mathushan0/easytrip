import React from 'react';
import clsx from 'clsx';

/**
 * Card Component
 * 3px border, 4px lift shadow on hover
 * Responsive padding, rounded corners
 */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  variant?: 'default' | 'glass' | 'raised';
  padding?: 'sm' | 'md' | 'lg';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      hover = true,
      variant = 'default',
      padding = 'md',
      className,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = clsx(
      // Base
      'rounded-lg',
      'transition-smooth',
      'border border-solid',

      // Padding
      {
        'sm': 'p-3 md:p-4',
        'md': 'p-4 md:p-6',
        'lg': 'p-6 md:p-8',
      }[padding],

      // Variants
      {
        'default': clsx(
          'bg-white dark:bg-gray-900',
          'border-gray-200 dark:border-gray-800',
          'shadow-flat-md hover:shadow-lift-lg',
          hover && 'hover:translate-y-[-4px]'
        ),
        'glass': clsx(
          'glass',
          'bg-opacity-50',
          'backdrop-blur-sm',
          'border-opacity-30'
        ),
        'raised': clsx(
          'bg-white dark:bg-gray-800',
          'border-gray-300 dark:border-gray-700',
          'shadow-lift-md hover:shadow-lift-lg'
        ),
      }[variant],

      // Hover effects
      hover && 'cursor-pointer'
    );

    return (
      <div
        ref={ref}
        className={clsx(baseStyles, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
