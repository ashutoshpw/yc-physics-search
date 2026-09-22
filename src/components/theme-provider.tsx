'use client';

import React, { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

const PREFERENCE_KEY = 'theme-preference';
const listeners = new Set<() => void>();

let currentTheme: Theme = 'dark';
if (typeof document !== 'undefined') {
  currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function getTheme(): Theme {
  return currentTheme;
}

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function applyTheme(theme: Theme, persist: boolean) {
  currentTheme = theme;
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
  if (persist) {
    try {
      localStorage.setItem(PREFERENCE_KEY, theme);
    } catch {
      // localStorage unavailable (private mode) — theme still applies for this session
    }
  }
  listeners.forEach((listener) => listener());
}

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => 'dark' as Theme);

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next, true);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem(PREFERENCE_KEY);
      } catch {
        // ignore
      }
      if (!stored) {
        applyTheme(event.matches ? 'dark' : 'light', false);
      }
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
