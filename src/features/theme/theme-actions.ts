import { applyThemeFromSeed } from '@/utils/theme-generator.js';

export type ThemeMode = 'light' | 'system' | 'dark';
export type ContrastLevel = 'standard' | 'medium' | 'high';

export interface ThemeState {
  themeMode: ThemeMode;
  customColor: string;
  contrastLevel: ContrastLevel;
}

export interface ThemeSetters {
  setThemeMode: (mode: ThemeMode) => void;
  setCustomColor: (color: string) => void;
  setContrastLevel: (level: ContrastLevel) => void;
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
  applyTheme(newMode, state.contrastLevel);
  // Reapply custom color if set to ensure it matches the new theme mode
  if (state.customColor) {
    applyCustomColor(state.customColor);
  }
  ext.storage.local.set({ themeMode: newMode });
}

export function setThemeMode(
  mode: ThemeMode,
  customColor: string,
  contrastLevel: ContrastLevel,
  setters: ThemeSetters,
  ext: typeof browser
) {
  setters.setThemeMode(mode);
  applyTheme(mode, contrastLevel);
  // Reapply custom color if set to ensure it matches the new theme mode
  if (customColor) {
    applyCustomColor(customColor);
  }
  ext.storage.local.set({ themeMode: mode });
}

export function applyTheme(themeMode: ThemeMode, contrastLevel: ContrastLevel = 'standard') {
  let isDark = false;
  if (themeMode === 'system') {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  } else {
    isDark = themeMode === 'dark';
  }
  const themeValue = `${isDark ? 'dark' : 'light'}-${contrastLevel}`;
  document.documentElement.setAttribute('data-theme', themeValue);
}

export function listenForSystemThemeChanges(
  getThemeMode: () => ThemeMode,
  getContrastLevel: () => ContrastLevel,
  applyThemeFn: (mode: ThemeMode, contrastLevel: ContrastLevel) => void
) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', () => {
    if (getThemeMode() === 'system') {
      applyThemeFn('system', getContrastLevel());
    }
  });
}

export function setContrastLevel(
  level: ContrastLevel,
  themeMode: ThemeMode,
  customColor: string,
  setters: ThemeSetters,
  ext: typeof browser
) {
  setters.setContrastLevel(level);
  applyTheme(themeMode, level);
  // Reapply custom color if set to ensure it matches the new contrast level
  if (customColor) {
    applyCustomColor(customColor);
  }
  ext.storage.local.set({ contrastLevel: level });
}

export function applyCustomColor(customColor: string) {
  if (customColor) {
    // Get current theme mode and contrast level from data-theme attribute
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light-standard';
    const parts = currentTheme.split('-');
    const isDark = parts[0] === 'dark';
    const contrastLevelStr = parts[1] || 'standard';

    // Convert contrast level string to number
    const contrastLevelMap: Record<string, number> = {
      standard: 0,
      medium: 0.5,
      high: 1.0,
    };
    const contrastLevel = contrastLevelMap[contrastLevelStr] || 0;

    // Generate full Material Design color scheme from the seed color
    applyThemeFromSeed(customColor, isDark, contrastLevel);
  } else {
    // Remove custom color by reloading the page to reset to default theme
    window.location.reload();
  }
}
