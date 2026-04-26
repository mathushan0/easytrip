import React from 'react';
import clsx from 'clsx';

/**
 * ProgressBar Component
 * Progress bar showing current vs. max, color per category
 */

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  current: number;
  max: number;
  category?: 'food' | 'landmark' | 'transport' | 'culture' | 'budget' | 'accommodation' | 'general';
  showLabel?: boolean;
  animated?: boolean;
  height?: 'sm' | 'md' | 'lg';
}

const categoryColors = {
  food: 'bg-red-500',
  landmark: 'bg-blue-500',
  transport: 'bg-orange-500',
  culture: 'bg-purple-500',
  budget: 'bg-yellow-500',
  accommodation: 'bg-teal-500',
  general: 'bg-gray-500',
};

const heightClasses = {
  'sm': 'h-1',
  'md': 'h-2',
  'lg': 'h-3',
};

const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  max,
  category = 'general',
  showLabel = true,
  animated = true,
  height = 'md',
  className,
  ...props
}) => {
  const percentage = Math.min((current / max) * 100, 100);

  return (
    <div className={clsx('w-full', className)} {...props}>
      {showLabel && (
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            Progress
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            {current} / {max}
          </span>
        </div>
      )}

      <div className={clsx(
        'w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
        heightClasses[height]
      )}>
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-300',
            categoryColors[category],
            animated && 'animate-pulse-soft'
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>

      {showLabel && (
        <div className="mt-2 text-right text-xs font-medium text-gray-600 dark:text-gray-400">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
