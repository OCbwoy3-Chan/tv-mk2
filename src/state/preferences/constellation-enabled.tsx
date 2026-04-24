import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import type {PropsWithChildren} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['constellationEnabled']
type SetContext = (v: persisted.Schema['constellationEnabled']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.constellationEnabled,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['constellationEnabled']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('constellationEnabled'))

  const setStateWrapped = useCallback(
    (constellationEnabled: persisted.Schema['constellationEnabled']) => {
      setState(constellationEnabled)
      persisted.write('constellationEnabled', constellationEnabled)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate(
      'constellationEnabled',
      nextConstellationEnabled => {
        setState(nextConstellationEnabled)
      },
    )
  }, [setStateWrapped])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function useConstellationEnabled() {
  return useContext(stateContext)
}

export function useSetConstellationEnabled() {
  return useContext(setContext)
}
