import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

// Preference: disableSavesMetrics – when true, disables saves metrics on posts

type StateContext = persisted.Schema['disableSavesMetrics']
// Same setter signature used across other preference modules
type SetContext = (v: persisted.Schema['disableSavesMetrics']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.disableSavesMetrics,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['disableSavesMetrics']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('disableSavesMetrics'))

  const setStateWrapped = useCallback(
    (value: persisted.Schema['disableSavesMetrics']) => {
      setState(value)
      persisted.write('disableSavesMetrics', value)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('disableSavesMetrics', next => {
      setState(next)
    })
  }, [setStateWrapped])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function useDisableSavesMetrics() {
  return useContext(stateContext)
}

export function useSetDisableSavesMetrics() {
  return useContext(setContext)
}
