import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

// Preference: disableFollowingMetrics – when true, disables following metrics on profiles

type StateContext = persisted.Schema['disableFollowingMetrics']
// Same setter signature used across other preference modules
type SetContext = (v: persisted.Schema['disableFollowingMetrics']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.disableFollowingMetrics,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['disableFollowingMetrics']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('disableFollowingMetrics'))

  const setStateWrapped = useCallback(
    (value: persisted.Schema['disableFollowingMetrics']) => {
      setState(value)
      persisted.write('disableFollowingMetrics', value)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('disableFollowingMetrics', next => {
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

export function useDisableFollowingMetrics() {
  return useContext(stateContext)
}

export function useSetDisableFollowingMetrics() {
  return useContext(setContext)
}
