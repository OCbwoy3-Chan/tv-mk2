import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

// Preference: disableQuotesMetrics – when true, disables quotes metrics on posts

type StateContext = persisted.Schema['disableQuotesMetrics']
// Same setter signature used across other preference modules
type SetContext = (v: persisted.Schema['disableQuotesMetrics']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.disableQuotesMetrics,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['disableQuotesMetrics']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('disableQuotesMetrics'))

  const setStateWrapped = useCallback(
    (value: persisted.Schema['disableQuotesMetrics']) => {
      setState(value)
      persisted.write('disableQuotesMetrics', value)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('disableQuotesMetrics', next => {
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

export function useDisableQuotesMetrics() {
  return useContext(stateContext)
}

export function useSetDisableQuotesMetrics() {
  return useContext(setContext)
}
