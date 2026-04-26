import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeName = 'bubbly' | 'aurora' | 'warm_sand' | 'electric';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeName;
  defaultDarkMode?: boolean;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'bubbly',
  defaultDarkMode = false,
}) => {
  const [theme, setThemeState] = useState<ThemeName>(defaultTheme);
  const [isDarkMode, setIsDarkModeState] = useState(defaultDarkMode);

  // Load persisted preferences from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('easytrip-theme') as ThemeName | null;
    const savedDarkMode = localStorage.getItem('easytrip-dark-mode');

    if (savedTheme) {
      setThemeState(savedTheme);
    }

    if (savedDarkMode !== null) {
      setIsDarkModeState(JSON.parse(savedDarkMode));
    }

    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (!savedDarkMode) {
      setIsDarkModeState(prefersDark);
    }
  }, []);

  // Apply theme to HTML element
  useEffect(() => {
    const html = document.documentElement;

    // Set theme data attribute
    html.setAttribute('data-theme', theme);

    // Set dark mode class
    if (isDarkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }

    // Persist preferences
    localStorage.setItem('easytrip-theme', theme);
    localStorage.setItem('easytrip-dark-mode', JSON.stringify(isDarkMode));
  }, [theme, isDarkMode]);

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
  };

  const setIsDarkMode = (isDark: boolean) => {
    setIsDarkModeState(isDark);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDarkMode, setIsDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
