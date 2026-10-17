export type HomeTheme = 'light' | 'dark';

export const HOME_THEME_KEY = 'ts-home-theme';

type Listener = () => void;

const listeners = new Set<Listener>();

let memoryTheme: HomeTheme | null = null;

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function getHomeTheme(): HomeTheme {
  if (memoryTheme) return memoryTheme;
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = localStorage.getItem(HOME_THEME_KEY);
    if (stored === 'light' || stored === 'dark') {
      memoryTheme = stored;
      return stored;
    }
  } catch {
    /* private */
  }
  memoryTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  return memoryTheme;
}

/** Snapshot SSR / hidratación: siempre light para evitar mismatch. */
export function getHomeThemeServerSnapshot(): HomeTheme {
  return 'light';
}

export function setHomeTheme(theme: HomeTheme): void {
  memoryTheme = theme;
  try {
    localStorage.setItem(HOME_THEME_KEY, theme);
  } catch {
    /* private */
  }
  emit();
}

export function toggleHomeTheme(): HomeTheme {
  const next = getHomeTheme() === 'dark' ? 'light' : 'dark';
  setHomeTheme(next);
  return next;
}

export function subscribeHomeTheme(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Alias legacy (por si queda algún import). */
export function readHomeTheme(): HomeTheme {
  return getHomeTheme();
}
