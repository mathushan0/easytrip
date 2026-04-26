import React from 'react';
import clsx from 'clsx';

/**
 * Button Component
 * 4 variants: primary, secondary, danger, ghost
 * Spring hover animation with tap target (44px minimum)
 */

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      icon,
      iconPosition = 'left',
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = clsx(
      // Base
      'transition-smooth',
      'font-nunito font-semibold',
      'rounded-md',
      'tap-target',
      'inline-flex items-center justify-center gap-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'active:scale-95',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',

      // Full width
      fullWidth && 'w-full',

      // Size
      {
        'sm': 'px-3 py-2 text-sm',
        'md': 'px-4 py-3 text-base',
        'lg': 'px-6 py-4 text-lg',
      }[size],

      // Variant styles
      {
        'primary': clsx(
          'bg-gradient-to-r from-blue-400 to-blue-500',
          'text-white',
          'hover:from-blue-500 hover:to-blue-600',
          'hover:shadow-lift-md',
          'focus:ring-blue-300',
          'active:translate-y-px'
        ),
        'secondary': clsx(
          'bg-gray-200 text-gray-900',
          'hover:bg-gray-300',
          'hover:shadow-lift-sm',
          'focus:ring-gray-400',
          'dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
        ),
        'danger': clsx(
          'bg-red-500 text-white',
          'hover:bg-red-600',
          'hover:shadow-lift-md',
          'focus:ring-red-300',
          'active:translate-y-px'
        ),
        'ghost': clsx(
          'bg-transparent text-gray-600',
          'hover:bg-gray-100',
          'focus:ring-gray-300',
          'dark:text-gray-300 dark:hover:bg-gray-800'
        ),
      }[variant]
    );

    const iconEl = icon && (
      <span className={clsx('flex items-center justify-center', isLoading && 'animate-spin')}>
        {icon}
      </span>
    );

    return (
      <button
        ref={ref}
        className={clsx(baseStyles, className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {iconPosition === 'left' && iconEl}
        {children && <span>{children}</span>}
        {iconPosition === 'right' && iconEl}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
