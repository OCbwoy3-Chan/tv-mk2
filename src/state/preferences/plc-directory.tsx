import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['plcDirectory']
type SetContext = (v: persisted.Schema['plcDirectory']) => void
type CustomStateContext = persisted.Schema['plcDirectoryCustom']
type SetCustomContext = (v: persisted.Schema['plcDirectoryCustom']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.plcDirectory,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['plcDirectory']) => {},
)
const customStateContext = createContext<CustomStateContext>(undefined)
const setCustomContext = createContext<SetCustomContext>(
  (_: persisted.Schema['plcDirectoryCustom']) => {},
)

function normalizeOrigin(input: string) {
  try {
    return new URL(input).origin
  } catch {
    return null
  }
}

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('plcDirectory'))
  const [customState, setCustomState] = useState(
    persisted.get('plcDirectoryCustom'),
  )

  const setStateWrapped = useCallback(
    (plcDirectory: persisted.Schema['plcDirectory']) => {
      setState(plcDirectory)
      persisted.write('plcDirectory', plcDirectory)
    },
    [setState],
  )

  const setCustomStateWrapped = useCallback(
    (plcDirectoryCustom: persisted.Schema['plcDirectoryCustom']) => {
      setCustomState(plcDirectoryCustom)
      persisted.write('plcDirectoryCustom', plcDirectoryCustom)
    },
    [setCustomState],
  )

  useEffect(() => {
    return persisted.onUpdate('plcDirectory', nextPlcDirectory => {
      setState(nextPlcDirectory)
    })
  }, [setStateWrapped])

  useEffect(() => {
    return persisted.onUpdate('plcDirectoryCustom', nextPlcDirectoryCustom => {
      setCustomState(nextPlcDirectoryCustom)
    })
  }, [setCustomStateWrapped])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        <customStateContext.Provider value={customState}>
          <setCustomContext.Provider value={setCustomStateWrapped}>
            {children}
          </setCustomContext.Provider>
        </customStateContext.Provider>
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function usePlcDirectorySetting() {
  return useContext(stateContext)
}

export function usePlcDirectoryCustom() {
  return useContext(customStateContext)
}

export function usePlcDirectory() {
  return (
    normalizeOrigin(
      useContext(stateContext) ?? persisted.defaults.plcDirectory!,
    ) ?? persisted.defaults.plcDirectory!
  )
}

export function useSetPlcDirectory() {
  return useContext(setContext)
}

export function useSetPlcDirectoryCustom() {
  return useContext(setCustomContext)
}

export function readPlcDirectory() {
  return (
    normalizeOrigin(
      persisted.get('plcDirectory') ?? persisted.defaults.plcDirectory!,
    ) ?? persisted.defaults.plcDirectory!
  )
}
