import {useLayoutEffect} from 'react'
import {type ColorSchemeName, useColorScheme} from 'react-native'
import {type ThemeName} from '@bsky.app/alf'

import {useThemePrefs} from '#/state/shell'
import {IS_WEB} from '#/env'
import {WITCHSKY_DARK_THEME,WITCHSKY_THEME} from '#/features/themes/catalog'

export function useColorModeTheme(): ThemeName {
  const theme = useThemeName()

  useLayoutEffect(() => {
    updateDocument(theme)
  }, [theme])

  return theme
}

export function useThemeName(): ThemeName {
  const colorScheme = useColorScheme()
  const {colorMode, darkTheme} = useThemePrefs()

  return getThemeName(colorScheme, colorMode, darkTheme)
}

function getThemeName(
  colorScheme: ColorSchemeName | null | undefined,
  colorMode: 'system' | 'light' | 'dark',
  darkTheme?: ThemeName,
) {
  if (
    (colorMode === 'system' && colorScheme === 'light') ||
    colorMode === 'light'
  ) {
    return 'light'
  } else {
    return darkTheme ?? 'dim'
  }
}

function updateDocument(theme: ThemeName) {
  if (IS_WEB && typeof window !== 'undefined') {
    const html = window.document.documentElement

    // remove any other color mode classes
    html.className = html.className.replace(/(theme)--\w+/g, '')
    html.classList.add(`theme--${theme}`)
    try {
      window.localStorage.setItem('ALF_THEME', theme)
    } catch {}
  }
}

export function getBackgroundColor(theme: ThemeName): string {
  switch (theme) {
    case 'light':
      return WITCHSKY_THEME.base.colors.canvas
    case 'dark':
      return WITCHSKY_DARK_THEME.base.colors.canvas
    case 'dim':
      return WITCHSKY_DARK_THEME.base.colors.canvas
  }
}
