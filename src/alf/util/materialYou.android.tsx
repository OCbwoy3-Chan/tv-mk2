import {createContext, use, useEffect, useState} from 'react'
import {AppState} from 'react-native'
import {
  getPalette,
  getPaletteSync,
  type MaterialYouPalette,
} from '@assembless/react-native-material-you'

let palette = getPaletteSync() as MaterialYouPalette

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

const colorsChangedCallbacks = new Set<() => void>()

AppState.addEventListener('focus', () => {
  getPalette()
    .then((newPalette: MaterialYouPalette) => {
      // check if colors changed
      const colorsChanged = Object.keys(newPalette).some(key => {
        const colorKey = key as keyof MaterialYouPalette
        return newPalette[colorKey]?.some(
          (color, index) => color !== palette[colorKey]?.[index],
        )
      })
      if (colorsChanged) {
        palette = newPalette
        for (const callback of colorsChangedCallbacks) {
          callback()
        }
      }
    })
    .catch(err => {
      console.error('Failed to get Material You palette:', err)
    })
})

function onMaterialYouPaletteChange(callback: () => void) {
  colorsChangedCallbacks.add(callback)
  return () => {
    colorsChangedCallbacks.delete(callback)
  }
}

const PaletteProvider = createContext(palette)

export function MaterialYouPaletteProvider({
  children,
}: React.PropsWithChildren) {
  const [thePalette, setThePalette] = useState(palette)
  useEffect(() => {
    const unsubscribe = onMaterialYouPaletteChange(() => {
      setThePalette(() => palette)
    })

    return unsubscribe
  }, [])

  return (
    <PaletteProvider.Provider value={thePalette}>
      {children}
    </PaletteProvider.Provider>
  )
}

export function useMaterialYouPalette() {
  return use(PaletteProvider)
}
