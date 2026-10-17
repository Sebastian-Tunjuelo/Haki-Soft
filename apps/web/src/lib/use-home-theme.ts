'use client';

import { useSyncExternalStore } from 'react';
import {
  getHomeTheme,
  getHomeThemeServerSnapshot,
  subscribeHomeTheme,
  toggleHomeTheme,
  type HomeTheme,
} from '@/src/lib/home-theme';

export function useHomeTheme(): {
  theme: HomeTheme;
  toggleTheme: () => void;
} {
  const theme = useSyncExternalStore(
    subscribeHomeTheme,
    getHomeTheme,
    getHomeThemeServerSnapshot,
  );

  return {
    theme,
    toggleTheme: toggleHomeTheme,
  };
}
