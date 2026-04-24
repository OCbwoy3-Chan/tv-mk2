import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

// Preference: disableRepostsMetrics – when true, disables reposts metrics on posts

type StateContext = persisted.Schema['disableRepostsMetrics']
// Same setter signature used across other preference modules
type SetContext = (v: persisted.Schema['disableRepostsMetrics']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.disableRepostsMetrics,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['disableRepostsMetrics']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('disableRepostsMetrics'))

  const setStateWrapped = useCallback(
    (value: persisted.Schema['disableRepostsMetrics']) => {
      setState(value)
      persisted.write('disableRepostsMetrics', value)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('disableRepostsMetrics', next => {
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

export function useDisableRepostsMetrics() {
  return useContext(stateContext)
}

export function useSetDisableRepostsMetrics() {
  return useContext(setContext)
}
