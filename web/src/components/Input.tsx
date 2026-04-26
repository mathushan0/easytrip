import React from 'react';
import clsx from 'clsx';

/**
 * Input Component
 * Supports text input, select, checkbox, error states
 * Full width, touch-friendly (44px min height)
 */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      icon,
      fullWidth = false,
      type = 'text',
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div className={clsx('flex flex-col gap-1', fullWidth && 'w-full')}>
        {label && (
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 flex items-center text-gray-400">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            type={type}
            className={clsx(
              // Base
              'w-full',
              'px-4 py-3',
              'rounded-md',
              'text-base',
              'font-nunito',
              'tap-target',
              'transition-smooth',

              // Icon spacing
              icon && 'pl-10',

              // Border & background
              'border border-solid',
              'bg-white dark:bg-gray-900',
              'border-gray-300 dark:border-gray-700',

              // Focus
              'focus:outline-none',
              'focus:border-blue-500',
              'focus:ring-2',
              'focus:ring-blue-200 dark:focus:ring-blue-900',

              // Disabled
              disabled && 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800',

              // Error
              error && 'border-red-500 focus:border-red-500 focus:ring-red-200',

              className
            )}
            disabled={disabled}
            {...props}
          />
        </div>

        {error && (
          <span className="text-xs text-red-500 font-semibold flex items-center gap-1">
            ⚠️ {error}
          </span>
        )}

        {helperText && !error && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

/**
 * Select Component
 */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ label: string; value: string }>;
  fullWidth?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      options,
      fullWidth = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div className={clsx('flex flex-col gap-1', fullWidth && 'w-full')}>
        {label && (
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}

        <select
          ref={ref}
          className={clsx(
            // Base
            'w-full',
            'px-4 py-3',
            'rounded-md',
            'text-base',
            'font-nunito',
            'tap-target',
            'transition-smooth',

            // Border & background
            'border border-solid',
            'bg-white dark:bg-gray-900',
            'border-gray-300 dark:border-gray-700',

            // Focus
            'focus:outline-none',
            'focus:border-blue-500',
            'focus:ring-2',
            'focus:ring-blue-200',

            // Disabled
            disabled && 'opacity-50 cursor-not-allowed',

            // Error
            error && 'border-red-500',

            className
          )}
          disabled={disabled}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {error && (
          <span className="text-xs text-red-500">⚠️ {error}</span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

/**
 * Checkbox Component
 */
export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          type="checkbox"
          className={clsx(
            'w-5 h-5',
            'rounded',
            'cursor-pointer',
            'transition-smooth',
            'accent-blue-500',
            className
          )}
          {...props}
        />
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
