import {createContext, type JSX, use, useMemo} from 'react'
import {type MaterialYouPalette} from '@assembless/react-native-material-you'

import {generatePaletteFromColor, type GenerationStyle} from './material3'

export function getMaterialYouColor(
  palette: MaterialYouPalette,
  color: [
    'system_accent1',
    'system_accent2',
    'system_accent3',
    'system_neutral1',
    'system_neutral2',
    'system_error',
  ][number],
  shade: [0, 10, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000][number],
  fallback: string = '#000000',
): string {
  const shades = [0, 10, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
  let shadeIndex = shades.findIndex(s => s === shade)
  if (shadeIndex === -1) {
    throw new Error(
      `Invalid shade: ${shade}. Valid shades are: ${shades.join(', ')}`,
    )
  }

  return palette[color]?.[shadeIndex] || fallback
}

const PaletteProvider = createContext(
  generatePaletteFromColor('#000000', 'TONAL_SPOT'),
)

export function MaterialYouPaletteProvider({
  accent,
  style,
  children,
}: React.PropsWithChildren<{
  accent: string
  style?: GenerationStyle
}>): JSX.Element {
  const value = useMemo(() => {
    return generatePaletteFromColor(accent, style)
  }, [accent, style])

  return (
    <PaletteProvider.Provider value={value}>
      {children}
    </PaletteProvider.Provider>
  )
}

export function useMaterialYouPalette() {
  return use(PaletteProvider)
}