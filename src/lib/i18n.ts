import { getLocaleFromNavigator, init, locale, register } from 'svelte-i18n';

register('en', () => import('./locales/en.json'));
register('es', () => import('./locales/es.json'));
register('fr', () => import('./locales/fr.json'));
register('de', () => import('./locales/de.json'));
register('ja', () => import('./locales/ja.json'));
register('zh', () => import('./locales/zh.json'));
register('ar', () => import('./locales/ar.json'));

// Set locale immediately before init to prevent initialization errors
const initialLocale = getLocaleFromNavigator() || 'en';
locale.set(initialLocale);

// Initialize with the set locale
init({
  fallbackLocale: 'en',
  initialLocale: initialLocale,
});

export { locale };

export async function setLanguage(newLocale: string) {
  // First set the locale
  locale.set(newLocale);

  // Then re-initialize with the new locale to load translations
  await init({
    fallbackLocale: 'en',
    initialLocale: newLocale,
  });

  // Ensure locale is set after init
  locale.set(newLocale);
}

export function getCurrentLocale(): string {
  return getLocaleFromNavigator() || 'en';
}

export const isRTL = (locale: string): boolean => {
  return ['ar', 'he', 'fa', 'ur'].includes(locale);
};
