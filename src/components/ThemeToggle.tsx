'use client';

import React from 'react';
import { ThemeAnimationType, useModeAnimation } from 'react-theme-switch-animation';
import { useTheme } from '@/components/theme-provider';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { ref, toggleSwitchTheme } = useModeAnimation({
    animationType: ThemeAnimationType.POLYGON,
    isDarkMode: theme === 'dark',
    onDarkModeChange: (isDark) => setTheme(isDark ? 'dark' : 'light'),
  });

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => void toggleSwitchTheme()}
      aria-label="Toggle color theme"
      title="Toggle color theme"
      className="w-7 h-7 rounded-md text-faint hover:text-foreground hover:bg-muted transition-colors flex items-center justify-center"
    >
      <svg
        className="w-4 h-4 block dark:hidden"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 18.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z" />
        <path d="M12 2.08V2M12 22v-.08M2.08 12H2M22 12h-.08M4.99 4.99 4.86 4.86M19.14 19.14l-.13-.13M19.01 4.99l.13-.13M4.86 19.14l.13-.13" />
      </svg>
      <svg
        className="w-4 h-4 hidden dark:block"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M2.03 12.42C2.39 17.57 6.76 21.76 11.99 21.99c3.69.16 6.99-1.56 8.97-4.27.82-1.11.38-1.85-.99-1.6-.67.12-1.36.17-2.08.14-4.89-.2-8.89-4.29-8.91-9.12-.01-1.3.26-2.53.75-3.65.54-1.24-.11-1.83-1.36-1.3-3.96 1.67-6.67 5.66-6.34 10.23Z" />
      </svg>
    </button>
  );
};
