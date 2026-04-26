export type ThemeMode = 'light' | 'system' | 'dark';

export interface ThemeState {
  themeMode: ThemeMode;
  customColor: string;
}

export interface ThemeSetters {
  setThemeMode: (mode: ThemeMode) => void;
  setCustomColor: (color: string) => void;
}

export function toggleTheme(state: ThemeState, setters: ThemeSetters, ext: typeof browser) {
  let newMode: ThemeMode;
  if (state.themeMode === 'light') {
    newMode = 'system';
  } else if (state.themeMode === 'system') {
    newMode = 'dark';
  } else {
    newMode = 'light';
  }
  setters.setThemeMode(newMode);
  applyTheme(newMode);
  ext.storage.local.set({ themeMode: newMode });
}

export function setThemeMode(mode: ThemeMode, setters: ThemeSetters, ext: typeof browser) {
  setters.setThemeMode(mode);
  applyTheme(mode);
  ext.storage.local.set({ themeMode: mode });
}

export function applyTheme(themeMode: ThemeMode) {
  let isDark = false;
  if (themeMode === 'system') {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  } else {
    isDark = themeMode === 'dark';
  }
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'custom');
}

export function listenForSystemThemeChanges(
  getThemeMode: () => ThemeMode,
  applyThemeFn: (mode: ThemeMode) => void
) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', () => {
    if (getThemeMode() === 'system') {
      applyThemeFn('system');
    }
  });
}

export function applyCustomColor(customColor: string) {
  if (customColor) {
    document.documentElement.style.setProperty('--color-primary', customColor);
    const root = document.querySelector(':root') as HTMLElement;
    if (root) {
      root.style.setProperty('--color-primary', customColor);
    }
  } else {
    document.documentElement.style.removeProperty('--color-primary');
    const root = document.querySelector(':root') as HTMLElement;
    if (root) {
      root.style.removeProperty('--color-primary');
    }
  }
}
