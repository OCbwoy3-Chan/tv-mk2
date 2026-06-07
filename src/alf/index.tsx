import {createContext, useCallback, useContext, useMemo, useState} from 'react'
import {createTheme, type Theme, type ThemeName, utils as baseUtils} from '@bsky.app/alf'
import chroma from 'chroma-js'

import {useThemePrefs} from '#/state/shell/color-mode'
import {
  computeFontScaleMultiplier,
  getFontFamily,
  getFontScale,
  setFontFamily as persistFontFamily,
  setFontScale as persistFontScale,
} from '#/alf/fonts'
import {
  blackskyscheme,
  blueskyscheme,
  catppuccinscheme,
  cyanscheme,
  deerscheme,
  evergardenscheme,
  kittyscheme,
  type Palette,
  reddwarfscheme,
  themes,
  witchskyscheme,
  zeppelinscheme,
} from '#/alf/themes'
import {
  contrastRatio,
  darken,
  lighten,
  rgbToHex,
} from '#/alf/util/colorGeneration'
import {type Device} from '#/storage'
import {getMaterial3Colors} from './util/material3Theme'
import {
  MaterialYouPaletteProvider,
  useMaterialYouPalette,
} from './util/materialYou'

export {type TextStyleProp, type Theme, type ViewStyleProp} from '@bsky.app/alf'
export {atoms} from '#/alf/atoms'
export * from '#/alf/breakpoints'
export * from '#/alf/fonts'
export * as tokens from '#/alf/tokens'
export * from '#/alf/util/flatten'
export * from '#/alf/util/platform'
export * from '#/alf/util/themeSelector'
export * from '#/alf/util/useGutters'
export const utils = {
  ...baseUtils,
  rgbToHex,
  lighten,
  darken,
  contrastRatio,
}


export type Alf = {
  themeName: ThemeName
  theme: Theme
  themes: typeof themes
  fonts: {
    scale: Exclude<Device['fontScale'], undefined>
    scaleMultiplier: number
    family: Device['fontFamily']
    setFontScale: (fontScale: Exclude<Device['fontScale'], undefined>) => void
    setFontFamily: (fontFamily: Device['fontFamily']) => void
  }
  /**
   * Feature flags or other gated options
   */
  flags: {}
}

/*
 * Context
 */
export const Context = createContext<Alf>({
  themeName: 'light',
  theme: themes.light,
  themes,
  fonts: {
    scale: getFontScale(),
    scaleMultiplier: computeFontScaleMultiplier(getFontScale()),
    family: getFontFamily(),
    setFontScale: () => {},
    setFontFamily: () => {},
  },
  flags: {},
})
Context.displayName = 'AlfContext'

export type SchemeType = typeof themes

export function changeHue(colorStr: string, hueShift: number) {
  if (!hueShift || hueShift === 0) return colorStr

  const color = chroma(colorStr).oklch()

  const newHue = (color[2] + hueShift + 360) % 360

  return chroma.oklch(color[0], color[1], newHue).hex()
}

export function shiftPalette(palette: Palette, hueShift: number): Palette {
  const newPalette = {...palette}
  const keys = Object.keys(newPalette) as Array<keyof Palette>

  keys.forEach(key => {
    if (
      key.startsWith('positive_') ||
      key.startsWith('negative_') ||
      key === 'like' ||
      key === 'pink' ||
      key === 'yellow'
    ) {
      return
    }
    newPalette[key] = changeHue(newPalette[key], hueShift)
  })

  return newPalette
}

export function hueShifter(scheme: SchemeType, hueShift: number): SchemeType {
  if (!hueShift || hueShift === 0) {
    return scheme
  }

  const lightPalette = shiftPalette(scheme.lightPalette, hueShift)
  const darkPalette = shiftPalette(scheme.darkPalette, hueShift)
  const dimPalette = shiftPalette(scheme.dimPalette, hueShift)

  const light = createTheme({
    scheme: 'light',
    name: 'light',
    palette: lightPalette,
  })

  const dark = createTheme({
    scheme: 'dark',
    name: 'dark',
    palette: darkPalette,
    options: {
      shadowOpacity: 0.4,
    },
  })

  const dim = createTheme({
    scheme: 'dark',
    name: 'dim',
    palette: dimPalette,
    options: {
      shadowOpacity: 0.4,
    },
  })

  return {
    lightPalette,
    darkPalette,
    dimPalette,
    light,
    dark,
    dim,
  }
}

export function useScheme(): SchemeType {
  const {hue, colorScheme} = useThemePrefs()
  const palette = useMaterialYouPalette()

  return useMemo(() => {
    let currentScheme = themes
    switch (colorScheme) {
      case 'witchsky':
        currentScheme = witchskyscheme
        break
      case 'bluesky':
        currentScheme = blueskyscheme
        break
      case 'blacksky':
        currentScheme = blackskyscheme
        break
      case 'deer':
        currentScheme = deerscheme
        break
      case 'zeppelin':
        currentScheme = zeppelinscheme
        break
      case 'kitty':
        currentScheme = kittyscheme
        break
      case 'reddwarf':
        currentScheme = reddwarfscheme
        break
      case 'catppuccin':
        currentScheme = catppuccinscheme
        break
      case 'evergarden':
        currentScheme = evergardenscheme
        break
      case 'cyan base':
        currentScheme = cyanscheme
        break
      case 'material3':
        currentScheme = getMaterial3Colors(palette).scheme
        break
      default:
        currentScheme = themes
        break
    }

    return hueShifter(currentScheme, hue)
  }, [colorScheme, hue, palette])
}

function ThemeProviderInner({
  children,
  theme: themeName,
  themesOverride,
}: React.PropsWithChildren<{
  theme: ThemeName
  themesOverride?: Partial<typeof themes>
}>) {
  const currentScheme = useScheme()
  const [fontScale, setFontScale] = useState<Alf['fonts']['scale']>(() =>
    getFontScale(),
  )
  const [fontScaleMultiplier, setFontScaleMultiplier] = useState(() =>
    computeFontScaleMultiplier(fontScale),
  )
  const setFontScaleAndPersist = useCallback<Alf['fonts']['setFontScale']>(
    fs => {
      setFontScale(fs)
      persistFontScale(fs)
      setFontScaleMultiplier(computeFontScaleMultiplier(fs))
    },
    [setFontScale],
  )
  const [fontFamily, setFontFamily] = useState<Alf['fonts']['family']>(() =>
    getFontFamily(),
  )
  const setFontFamilyAndPersist = useCallback<Alf['fonts']['setFontFamily']>(
    ff => {
      setFontFamily(ff)
      persistFontFamily(ff)
    },
    [setFontFamily],
  )

  const value = useMemo<Alf>(() => {
    // Use currentScheme for Witchsky's custom theming, but allow themesOverride from upstream
    const t = themesOverride
      ? {...themes, ...themesOverride}
      : currentScheme
    return {
      themes: t,
      themeName: themeName,
      theme: t[themeName],
      fonts: {
        scale: fontScale,
        scaleMultiplier: fontScaleMultiplier,
        family: fontFamily,
        setFontScale: setFontScaleAndPersist,
        setFontFamily: setFontFamilyAndPersist,
      },
      flags: {},
    }
  }, [
    currentScheme,
    themeName,
    fontScale,
    fontScaleMultiplier,
    fontFamily,
    setFontScaleAndPersist,
    setFontFamilyAndPersist,
    themesOverride,
  ])

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function ThemeProvider({
  children,
  theme: themeName,
}: React.PropsWithChildren<{theme: ThemeName}>) {
  const {material3Accent, material3Style} = useThemePrefs()
  return (
    <MaterialYouPaletteProvider accent={material3Accent} style={material3Style}>
      <ThemeProviderInner theme={themeName}>{children}</ThemeProviderInner>
    </MaterialYouPaletteProvider>
  )
}

export function useAlf() {
  return useContext(Context)
}

export function useTheme(theme?: ThemeName) {
  const alf = useAlf()
  return useMemo(() => {
    return theme ? alf.themes[theme] : alf.theme
  }, [theme, alf])
}
