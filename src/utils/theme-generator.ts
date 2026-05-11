import {
  argbFromHex,
  Hct,
  hexFromArgb,
  MaterialDynamicColors,
  SchemeTonalSpot,
  TonalPalette,
} from '@material/material-color-utilities';

const mdc = new MaterialDynamicColors();

function resolve(color: ReturnType<typeof mdc.primary>, scheme: SchemeTonalSpot): string {
  return hexFromArgb(color.getArgb(scheme));
}

// Map Material DynamicColors → CSS variables
function mapMaterialToColors(scheme: SchemeTonalSpot, sourceHct: Hct, isDark: boolean) {
  const colors: Record<string, string> = {};

  // Material Design colors
  colors['--md-primary'] = resolve(mdc.primary(), scheme);
  colors['--md-on-primary'] = resolve(mdc.onPrimary(), scheme);
  colors['--md-primary-container'] = resolve(mdc.primaryContainer(), scheme);
  colors['--md-on-primary-container'] = resolve(mdc.onPrimaryContainer(), scheme);

  colors['--md-secondary'] = resolve(mdc.secondary(), scheme);
  colors['--md-on-secondary'] = resolve(mdc.onSecondary(), scheme);
  colors['--md-secondary-container'] = resolve(mdc.secondaryContainer(), scheme);
  colors['--md-on-secondary-container'] = resolve(mdc.onSecondaryContainer(), scheme);

  colors['--md-tertiary'] = resolve(mdc.tertiary(), scheme);
  colors['--md-on-tertiary'] = resolve(mdc.onTertiary(), scheme);
  colors['--md-tertiary-container'] = resolve(mdc.tertiaryContainer(), scheme);
  colors['--md-on-tertiary-container'] = resolve(mdc.onTertiaryContainer(), scheme);

  colors['--md-error'] = resolve(mdc.error(), scheme);
  colors['--md-on-error'] = resolve(mdc.onError(), scheme);
  colors['--md-error-container'] = resolve(mdc.errorContainer(), scheme);
  colors['--md-on-error-container'] = resolve(mdc.onErrorContainer(), scheme);

  colors['--md-background'] = resolve(mdc.background(), scheme);
  colors['--md-on-background'] = resolve(mdc.onBackground(), scheme);
  colors['--md-surface'] = resolve(mdc.surface(), scheme);
  colors['--md-on-surface'] = resolve(mdc.onSurface(), scheme);
  colors['--md-surface-variant'] = resolve(mdc.surfaceVariant(), scheme);
  colors['--md-on-surface-variant'] = resolve(mdc.onSurfaceVariant(), scheme);
  colors['--md-outline'] = resolve(mdc.outline(), scheme);
  colors['--md-outline-variant'] = resolve(mdc.outlineVariant(), scheme);

  colors['--md-success'] = hexFromArgb(
    TonalPalette.fromHueAndChroma(142, Math.min(sourceHct.chroma, 48)).tone(isDark ? 80 : 40)
  );
  colors['--md-on-success'] = hexFromArgb(
    TonalPalette.fromHueAndChroma(142, Math.min(sourceHct.chroma, 48)).tone(isDark ? 20 : 100)
  );

  colors['--md-warning'] = hexFromArgb(
    TonalPalette.fromHueAndChroma(85, Math.min(sourceHct.chroma, 48)).tone(isDark ? 80 : 40)
  );
  colors['--md-on-warning'] = hexFromArgb(
    TonalPalette.fromHueAndChroma(85, Math.min(sourceHct.chroma, 48)).tone(isDark ? 20 : 100)
  );

  return colors;
}

/**
 * Generate and apply a theme from a seed color at runtime
 * @param seedColor - Hex color string (e.g., "#3b82f6")
 * @param isDark - Whether to generate dark theme
 * @param contrastLevel - Contrast level: 0 = standard, 0.5 = medium, 1.0 = high
 */
export function applyThemeFromSeed(
  seedColor: string,
  isDark: boolean = false,
  contrastLevel: number = 0
) {
  const sourceHct = Hct.fromInt(argbFromHex(seedColor));
  const scheme = new SchemeTonalSpot(sourceHct, isDark, contrastLevel);
  const colors = mapMaterialToColors(scheme, sourceHct, isDark);

  const root = document.documentElement;
  for (const [key, value] of Object.entries(colors)) {
    root.style.setProperty(key, value);
  }
}

/**
 * Generate theme CSS strings from a seed color
 * @param seedColor - Hex color string (e.g., "#3b82f6")
 * @returns CSS variable blocks for light and dark themes
 */
export function generateThemeCSS(seedColor: string): { light: string; dark: string } {
  const sourceHct = Hct.fromInt(argbFromHex(seedColor));
  const lightScheme = new SchemeTonalSpot(sourceHct, false, 0);
  const darkScheme = new SchemeTonalSpot(sourceHct, true, 0);

  const lightColors = mapMaterialToColors(lightScheme, sourceHct, false);
  const darkColors = mapMaterialToColors(darkScheme, sourceHct, true);

  let lightCSS = '[data-theme="custom"] {\n';
  for (const [key, value] of Object.entries(lightColors)) {
    lightCSS += `  ${key}: ${value};\n`;
  }
  lightCSS += '}\n';

  let darkCSS = '[data-theme="dark"] {\n';
  for (const [key, value] of Object.entries(darkColors)) {
    darkCSS += `  ${key}: ${value};\n`;
  }
  darkCSS += '}\n';

  return { light: lightCSS, dark: darkCSS };
}
