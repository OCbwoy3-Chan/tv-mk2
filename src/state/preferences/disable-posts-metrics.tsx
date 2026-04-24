import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

// Preference: disablePostsMetrics – when true, disables posts metrics on profiles

type StateContext = persisted.Schema['disablePostsMetrics']
// Same setter signature used across other preference modules
type SetContext = (v: persisted.Schema['disablePostsMetrics']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.disablePostsMetrics,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['disablePostsMetrics']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('disablePostsMetrics'))

  const setStateWrapped = useCallback(
    (value: persisted.Schema['disablePostsMetrics']) => {
      setState(value)
      persisted.write('disablePostsMetrics', value)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('disablePostsMetrics', next => {
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

export function useDisablePostsMetrics() {
  return useContext(stateContext)
}

export function useSetDisablePostsMetrics() {
  return useContext(setContext)
}
