import React from 'react';
import clsx from 'clsx';

/**
 * AuthLayout Component
 * Centered form layout (max-width 500px)
 * No sidebar/header
 * Used for SignIn, Consent, ProfileSetup pages
 */

export interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  illustration?: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  illustration,
}) => {
  return (
    <div className={clsx(
      'min-h-screen',
      'bg-gradient-to-br from-blue-50 to-indigo-100',
      'dark:from-gray-900 dark:to-gray-800',
      'flex items-center justify-center',
      'p-4 md:p-8'
    )}>
      <div className="w-full max-w-form">
        {/* Illustration */}
        {illustration && (
          <div className="mb-8 flex justify-center">
            {illustration}
          </div>
        )}

        {/* Title */}
        {title && (
          <h1 className="text-3xl md:text-4xl font-fredoka font-bold text-center mb-2 text-gray-900 dark:text-white">
            {title}
          </h1>
        )}

        {/* Subtitle */}
        {subtitle && (
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            {subtitle}
          </p>
        )}

        {/* Form content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lift-md p-6 md:p-8">
          {children}
        </div>

        {/* Footer text (optional) */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          <p>
            By continuing, you agree to our{' '}
            <a href="/terms" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
              Terms of Service
            </a>
            {' '}and{' '}
            <a href="/privacy" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
