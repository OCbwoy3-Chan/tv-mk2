import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = {
  colorMode: persisted.Schema['colorMode']
  darkTheme: persisted.Schema['darkTheme']
  colorScheme: persisted.Schema['colorScheme']
  hue: persisted.Schema['hue']
  material3Accent: persisted.Schema['material3Accent']
  material3Style: persisted.Schema['material3Style']
}
type SetContext = {
  setColorMode: (v: persisted.Schema['colorMode']) => void
  setDarkTheme: (v: persisted.Schema['darkTheme']) => void
  setColorScheme: (v: persisted.Schema['colorScheme']) => void
  setHue: (v: persisted.Schema['hue']) => void
  setMaterial3Accent: (v: persisted.Schema['material3Accent']) => void
  setMaterial3Style: (v: persisted.Schema['material3Style']) => void
}

const stateContext = createContext<StateContext>({
  colorMode: 'system',
  darkTheme: 'dark',
  colorScheme: 'witchsky',
  hue: 0,
  material3Accent: '#ee6300',
  material3Style: 'TONAL_SPOT',
})
stateContext.displayName = 'ColorModeStateContext'
const setContext = createContext<SetContext>({} as SetContext)
setContext.displayName = 'ColorModeSetContext'

export function Provider({children}: PropsWithChildren<{}>) {
  const [colorMode, setColorMode] = useState(() => persisted.get('colorMode'))
  const [darkTheme, setDarkTheme] = useState(() => persisted.get('darkTheme'))
  const [colorScheme, setColorScheme] = useState(() =>
    persisted.get('colorScheme'),
  )
  const [hue, setHue] = useState(() => persisted.get('hue'))
  const [material3Accent, setMaterial3Accent] = useState(
    () => persisted.get('material3Accent') ?? '#ee6300',
  )
  const [material3Style, setMaterial3Style] = useState(
    () => persisted.get('material3Style') ?? 'TONAL_SPOT',
  )

  const stateContextValue = useMemo(
    () => ({
      colorMode,
      darkTheme,
      colorScheme,
      hue,
      material3Accent,
      material3Style,
    }),
    [colorMode, darkTheme, colorScheme, hue, material3Accent, material3Style],
  )

  const setContextValue = useMemo(
    () => ({
      setColorMode: (_colorMode: persisted.Schema['colorMode']) => {
        setColorMode(_colorMode)
        void persisted.write('colorMode', _colorMode)
      },
      setDarkTheme: (_darkTheme: persisted.Schema['darkTheme']) => {
        setDarkTheme(_darkTheme)
        void persisted.write('darkTheme', _darkTheme)
      },
      setColorScheme: (_colorScheme: persisted.Schema['colorScheme']) => {
        setColorScheme(_colorScheme)
        void persisted.write('colorScheme', _colorScheme)
      },
      setHue: (_hue: persisted.Schema['hue']) => {
        setHue(_hue)
        void persisted.write('hue', _hue)
      },
      setMaterial3Accent: (
        _material3Accent: persisted.Schema['material3Accent'],
      ) => {
        setMaterial3Accent(_material3Accent)
        void persisted.write('material3Accent', _material3Accent)
      },
      setMaterial3Style: (_material3Style: persisted.Schema['material3Style']) => {
        setMaterial3Style(_material3Style)
        void persisted.write('material3Style', _material3Style)
      },
    }),
    [],
  )

  useEffect(() => {
    const unsub1 = persisted.onUpdate('darkTheme', nextDarkTheme => {
      setDarkTheme(nextDarkTheme)
    })
    const unsub2 = persisted.onUpdate('colorMode', nextColorMode => {
      setColorMode(nextColorMode)
    })
    const unsub3 = persisted.onUpdate('colorScheme', nextColorScheme => {
      setColorScheme(nextColorScheme)
    })
    const unsub4 = persisted.onUpdate('hue', nextHue => {
      setHue(nextHue)
    })
    const unsub5 = persisted.onUpdate(
      'material3Accent',
      nextMaterial3Accent => {
        setMaterial3Accent(nextMaterial3Accent)
      },
    )
    const unsub6 = persisted.onUpdate(
      'material3Style',
      nextMaterial3Style => {
        setMaterial3Style(nextMaterial3Style)
      },
    )
    return () => {
      unsub1()
      unsub2()
      unsub3()
      unsub4()
      unsub5()
      unsub6()
    }
  }, [])

  return (
    <stateContext.Provider value={stateContextValue}>
      <setContext.Provider value={setContextValue}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function useThemePrefs() {
  return useContext(stateContext)
}

export function useSetThemePrefs() {
  return useContext(setContext)
}
