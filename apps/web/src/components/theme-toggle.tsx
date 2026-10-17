'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'ts-theme:v1';

function readTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(mode: ThemeMode) {
  document.documentElement.setAttribute('data-theme', mode);
  localStorage.setItem(STORAGE_KEY, mode);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const next = readTheme();
    applyTheme(next);
    setTheme(next);
    setReady(true);
  }, []);

  const toggle = () => {
    const next: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
      disabled={!ready}
    >
      {theme === 'dark' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
    </button>
  );
}
