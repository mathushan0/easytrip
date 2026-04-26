import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

/**
 * RootLayout Component
 * Flex container: Sidebar (hidden on mobile) + Main content
 * Header always visible
 * Main content scrolls independently
 * Footer at bottom
 */

export interface RootLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  currentPath?: string;
  onNavigate?: (path: string) => void;
  userTier?: 'explorer' | 'voyager' | 'nomad_pro';
}

const RootLayout: React.FC<RootLayoutProps> = ({
  children,
  header,
  footer,
  currentPath = '/',
  onNavigate,
  userTier = 'explorer',
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <Header
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        navItems={[
          { label: 'Home', href: '/home' },
          { label: 'Trips', href: '/trips' },
          { label: 'Create', href: '/create' },
        ]}
      />

      {/* Main layout: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentPath={currentPath}
          onNavigate={onNavigate}
          userTier={userTier}
        />

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      {footer && (
        <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
          {footer}
        </footer>
      )}
    </div>
  );
};

export default RootLayout;
