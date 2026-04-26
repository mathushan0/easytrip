import React from 'react';
import clsx from 'clsx';

/**
 * Chip Component
 * Pill-shaped badge with category colors, tappable
 */

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: 'default' | 'filled' | 'outlined';
  color?: 'food' | 'landmark' | 'transport' | 'culture' | 'budget' | 'accommodation' | 'general';
  onRemove?: () => void;
  selected?: boolean;
}

const colorMap = {
  food: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100 border-red-300',
  landmark: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100 border-blue-300',
  transport: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-100 border-orange-300',
  culture: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-100 border-purple-300',
  budget: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100 border-yellow-300',
  accommodation: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-100 border-teal-300',
  general: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100 border-gray-300',
};

const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  (
    {
      label,
      variant = 'filled',
      color = 'general',
      onRemove,
      selected = false,
      className,
      ...props
    },
    ref
  ) => {
    const baseStyles = clsx(
      // Base
      'inline-flex items-center gap-2',
      'px-3 py-1.5',
      'rounded-full',
      'text-sm font-semibold',
      'tap-target',
      'transition-smooth',
      'cursor-pointer',
      'border',

      // Variant
      {
        'default': clsx(
          colorMap[color],
          'hover:shadow-flat-md'
        ),
        'filled': clsx(
          colorMap[color],
          'hover:shadow-flat-md'
        ),
        'outlined': clsx(
          'bg-transparent',
          colorMap[color]
        ),
      }[variant],

      // Selected state
      selected && 'ring-2 ring-offset-2 ring-blue-500'
    );

    return (
      <button
        ref={ref}
        className={clsx(baseStyles, className)}
        {...props}
      >
        <span>{label}</span>
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="ml-1 hover:opacity-70 transition-opacity"
            aria-label="Remove chip"
          >
            ×
          </button>
        )}
      </button>
    );
  }
);

Chip.displayName = 'Chip';

export default Chip;
