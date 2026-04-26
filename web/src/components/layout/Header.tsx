import React, { useState } from 'react';
import clsx from 'clsx';

/**
 * Header Component
 * Responsive navigation
 * Desktop (1024px+): Logo left, navigation center, user menu right
 * Tablet (768px-1024px): Logo left, hamburger menu right
 * Mobile (320px-768px): Logo center, hamburger menu right
 * Always sticky top, z-index 50
 */

export interface HeaderProps {
  logo?: React.ReactNode;
  onMenuToggle?: () => void;
  navItems?: Array<{ label: string; href: string }>;
  userMenu?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({
  logo,
  onMenuToggle,
  navItems = [],
  userMenu,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    onMenuToggle?.();
  };

  return (
    <header className={clsx(
      'sticky top-0 z-sticky',
      'bg-white dark:bg-gray-900',
      'border-b border-gray-200 dark:border-gray-800',
      'shadow-flat-sm',
      'h-header'
    )}>
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        {/* Logo - visible on all sizes */}
        <div className="flex-shrink-0 md:mr-8">
          {logo ? logo : (
            <div className="text-xl font-fredoka font-bold">EasyTrip</div>
          )}
        </div>

        {/* Navigation - hidden on mobile */}
        <nav className="hidden lg:flex items-center gap-8 flex-1">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-semibold"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* User menu and hamburger */}
        <div className="flex items-center gap-4 ml-auto">
          {/* User menu - hidden on mobile */}
          <div className="hidden md:block">
            {userMenu}
          </div>

          {/* Hamburger menu - visible on tablet and mobile */}
          <button
            onClick={toggleMenu}
            className={clsx(
              'lg:hidden',
              'p-2',
              'rounded-md',
              'hover:bg-gray-100 dark:hover:bg-gray-800',
              'transition-colors',
              'tap-target',
              'flex flex-col gap-1'
            )}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className={clsx(
              'w-6 h-0.5 bg-gray-600 dark:bg-gray-300 transition-transform',
              mobileMenuOpen && 'rotate-45 translate-y-2'
            )} />
            <span className={clsx(
              'w-6 h-0.5 bg-gray-600 dark:bg-gray-300 transition-opacity',
              mobileMenuOpen && 'opacity-0'
            )} />
            <span className={clsx(
              'w-6 h-0.5 bg-gray-600 dark:bg-gray-300 transition-transform',
              mobileMenuOpen && '-rotate-45 -translate-y-2'
            )} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <nav className="flex flex-col gap-3">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>
          {userMenu && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {userMenu}
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
