import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import type {PropsWithChildren} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['constellationInstance']
type SetContext = (v: persisted.Schema['constellationInstance']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.constellationInstance,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['constellationInstance']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('constellationInstance'))

  const setStateWrapped = useCallback(
    (constellationInstance: persisted.Schema['constellationInstance']) => {
      setState(constellationInstance)
      persisted.write('constellationInstance', constellationInstance)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate(
      'constellationInstance',
      nextConstellationInstance => {
        setState(nextConstellationInstance)
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

export function useConstellationInstance() {
  return useContext(stateContext) ?? persisted.defaults.constellationInstance!
}

export function useSetConstellationInstance() {
  return useContext(setContext)
}
