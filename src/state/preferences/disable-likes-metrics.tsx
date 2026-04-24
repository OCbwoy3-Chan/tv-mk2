import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

// Preference: disableLikesMetrics – when true, disables likes metrics on posts

type StateContext = persisted.Schema['disableLikesMetrics']
// Same setter signature used across other preference modules
type SetContext = (v: persisted.Schema['disableLikesMetrics']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.disableLikesMetrics,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['disableLikesMetrics']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('disableLikesMetrics'))

  const setStateWrapped = useCallback(
    (value: persisted.Schema['disableLikesMetrics']) => {
      setState(value)
      persisted.write('disableLikesMetrics', value)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('disableLikesMetrics', next => {
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

export function useDisableLikesMetrics() {
  return useContext(stateContext)
}

export function useSetDisableLikesMetrics() {
  return useContext(setContext)
}
