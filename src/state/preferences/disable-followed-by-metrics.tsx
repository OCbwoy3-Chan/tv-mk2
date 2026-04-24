import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

// Preference: disableFollowedByMetrics – when true, disables following metrics on profiles

type StateContext = persisted.Schema['disableFollowedByMetrics']
// Same setter signature used across other preference modules
type SetContext = (v: persisted.Schema['disableFollowedByMetrics']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.disableFollowedByMetrics,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['disableFollowedByMetrics']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('disableFollowedByMetrics'))

  const setStateWrapped = useCallback(
    (value: persisted.Schema['disableFollowedByMetrics']) => {
      setState(value)
      persisted.write('disableFollowedByMetrics', value)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('disableFollowedByMetrics', next => {
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

export function useDisableFollowedByMetrics() {
  return useContext(stateContext)
}

export function useSetDisableFollowedByMetrics() {
  return useContext(setContext)
}
