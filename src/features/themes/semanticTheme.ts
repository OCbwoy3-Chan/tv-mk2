import {createTheme} from '@bsky.app/alf'

import  {type Palette} from '#/alf/themes'
import  {
  type ActiveTheme,
  type SemanticColors,
  type ThemeColorSet,
  type ThemeMode,
} from './types'
import {getColorSet} from './types'
import {resolveHueRecord} from './hue'

const HEX = /^#?([0-9a-f]{6})$/i

function mix(from: string, to: string, amount: number) {
  const a = HEX.exec(from)?.[1]
  const b = HEX.exec(to)?.[1]
  if (!a || !b) return amount < 0.5 ? from : to
  const channel = (value: string, offset: number) =>
    Number.parseInt(value.slice(offset, offset + 2), 16)
  const next = [0, 2, 4]
    .map(offset =>
      Math.round(
        channel(a, offset) + (channel(b, offset) - channel(a, offset)) * amount,
      )
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')
  return `#${next}`
}

function statusRamp(canvas: string, color: string, text: string) {
  return {
    25: mix(canvas, color, 0.08),
    50: mix(canvas, color, 0.14),
    100: mix(canvas, color, 0.24),
    200: mix(canvas, color, 0.38),
    300: mix(canvas, color, 0.56),
    400: mix(canvas, color, 0.78),
    500: color,
    600: mix(color, text, 0.12),
    700: mix(color, text, 0.28),
    800: mix(color, text, 0.45),
    900: mix(color, text, 0.62),
    950: mix(color, text, 0.76),
    975: mix(color, text, 0.86),
  }
}

function palette(colors: SemanticColors, mode: ThemeMode): Palette {
  const positive = statusRamp(colors.canvas, colors.positive, colors.text)
  const negative = statusRamp(colors.canvas, colors.critical, colors.text)
  const primary = statusRamp(colors.canvas, colors.accent, colors.text)
  return {
    // These are literal utility colors throughout the app (video chrome,
    // scrims, and shadows), not semantic foreground roles.
    white: '#ffffff',
    black: '#000000',
    like: colors.favorite,
    pink: colors.favorite,
    yellow: colors.warning,
    contrast_0: colors.canvas,
    contrast_25: colors.surface,
    // Raised controls sit above a dark canvas, while light controls need a
    // recessed tint. This keeps authored dark surfaces from being greyed out
    // by interpolation toward the border color.
    contrast_50:
      mode === 'dark'
        ? colors.surfaceRaised
        : mix(colors.surface, colors.border, 0.35),
    contrast_100: colors.border,
    contrast_200: colors.border,
    contrast_300: mix(colors.border, colors.textMuted, 0.2),
    contrast_400: mix(colors.border, colors.textMuted, 0.4),
    contrast_500: mix(colors.border, colors.textMuted, 0.55),
    contrast_600: mix(colors.border, colors.textMuted, 0.75),
    contrast_700: colors.textMuted,
    contrast_800: mix(colors.textMuted, colors.text, 0.25),
    contrast_900: mix(colors.textMuted, colors.text, 0.5),
    contrast_950: mix(colors.textMuted, colors.text, 0.7),
    contrast_975: mix(colors.textMuted, colors.text, 0.85),
    contrast_1000: colors.text,
    primary_25: primary[25],
    primary_50: primary[50],
    primary_100: colors.accentSoft,
    primary_200: primary[200],
    primary_300: primary[300],
    primary_400: primary[400],
    primary_500: colors.accent,
    primary_600: primary[600],
    primary_700: primary[700],
    primary_800: primary[800],
    primary_900: primary[900],
    primary_950: primary[950],
    primary_975: primary[975],
    positive_25: positive[25],
    positive_50: positive[50],
    positive_100: positive[100],
    positive_200: positive[200],
    positive_300: positive[300],
    positive_400: positive[400],
    positive_500: positive[500],
    positive_600: positive[600],
    positive_700: positive[700],
    positive_800: positive[800],
    positive_900: positive[900],
    positive_950: positive[950],
    positive_975: positive[975],
    negative_25: negative[25],
    negative_50: negative[50],
    negative_100: negative[100],
    negative_200: negative[200],
    negative_300: negative[300],
    negative_400: negative[400],
    negative_500: negative[500],
    negative_600: negative[600],
    negative_700: negative[700],
    negative_800: negative[800],
    negative_900: negative[900],
    negative_950: negative[950],
    negative_975: negative[975],
  }
}

function themeFor(
  set: ThemeColorSet,
  mode: ThemeMode,
  name: 'light' | 'dark' | 'dim',
) {
  return createTheme({
    scheme: mode,
    name,
    palette: palette(set.colors, mode),
    options: mode === 'dark' ? {shadowOpacity: 0.4} : undefined,
  })
}

export function activeThemeToScheme(activeTheme: ActiveTheme) {
  const lightRecord = resolveHueRecord(
    activeTheme.light.record,
    activeTheme.light.hue ?? 0,
  )
  const darkRecord = resolveHueRecord(
    activeTheme.dark.record,
    activeTheme.dark.hue ?? 0,
  )
  const light = getColorSet(lightRecord, activeTheme.light.colorSet)
  const dark = getColorSet(darkRecord, activeTheme.dark.colorSet)
  if (!light || !dark) return
  const lightTheme = themeFor(light, 'light', 'light')
  const darkTheme = themeFor(dark, 'dark', 'dark')
  const dimTheme = themeFor(dark, 'dark', 'dim')
  return {
    lightPalette: lightTheme.palette,
    darkPalette: darkTheme.palette,
    dimPalette: dimTheme.palette,
    light: lightTheme,
    dark: darkTheme,
    dim: dimTheme,
  }
}
