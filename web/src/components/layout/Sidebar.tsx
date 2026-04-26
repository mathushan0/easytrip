import React from 'react';
import clsx from 'clsx';

/**
 * Sidebar Component
 * Desktop: Always visible left sidebar (200px), navigation links
 * Tablet/Mobile: Hidden by default, hamburger opens overlay sidebar
 * Links: Home, Trips, Create Trip, Budget, Social (if Voyager+), Settings
 * Logout at bottom
 */

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  currentPath?: string;
  onNavigate?: (path: string) => void;
  userTier?: 'explorer' | 'voyager' | 'nomad_pro';
}

const navigationItems = [
  { label: 'Home', path: '/home', icon: '🏠' },
  { label: 'Trips', path: '/trips', icon: '✈️' },
  { label: 'Create Trip', path: '/create', icon: '➕' },
  { label: 'Budget', path: '/budget', icon: '💰' },
  { label: 'Settings', path: '/settings', icon: '⚙️' },
];

const Sidebar: React.FC<SidebarProps> = ({
  isOpen = true,
  onClose,
  currentPath = '/',
  onNavigate,
  userTier = 'explorer',
}) => {
  const filteredItems = navigationItems.filter(item => {
    // Social Intelligence only for Voyager+
    if (item.label === 'Social' && userTier === 'explorer') {
      return false;
    }
    return true;
  });

  const isSocialPlanAvailable = userTier === 'voyager' || userTier === 'nomad_pro';

  const sidebarContent = (
    <div className="flex flex-col h-full p-6">
      {/* Logo */}
      <div className="mb-8">
        <div className="text-xl font-fredoka font-bold text-blue-500">EasyTrip</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{userTier}</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2">
        {filteredItems.map((item) => (
          <button
            key={item.path}
            onClick={() => {
              onNavigate?.(item.path);
              onClose?.();
            }}
            className={clsx(
              'w-full text-left px-4 py-3 rounded-md transition-colors tap-target',
              currentPath === item.path
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-100 font-semibold'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            <span className="mr-3">{item.icon}</span>
            {item.label}
          </button>
        ))}

        {/* Social Intelligence - Voyager+ only */}
        {isSocialPlanAvailable && (
          <button
            onClick={() => {
              onNavigate?.('/social');
              onClose?.();
            }}
            className={clsx(
              'w-full text-left px-4 py-3 rounded-md transition-colors tap-target',
              currentPath === '/social'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-100 font-semibold'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            <span className="mr-3">👥</span>
            Social
          </button>
        )}
      </nav>

      {/* Logout */}
      <button className="w-full px-4 py-3 rounded-md bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 font-semibold hover:bg-red-200 dark:hover:bg-red-800 transition-colors tap-target">
        🚪 Logout
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar - always visible */}
      <aside className="hidden lg:block w-sidebar bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile/tablet overlay sidebar */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={onClose}
          />

          {/* Sidebar panel */}
          <aside className="fixed left-0 top-0 h-screen z-40 lg:hidden w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
};

export default Sidebar;
