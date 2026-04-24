import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

// Preference: disableReplyMetrics – when true, disables reply metrics on posts

type StateContext = persisted.Schema['disableReplyMetrics']
// Same setter signature used across other preference modules
type SetContext = (v: persisted.Schema['disableReplyMetrics']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.disableReplyMetrics,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['disableReplyMetrics']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('disableReplyMetrics'))

  const setStateWrapped = useCallback(
    (value: persisted.Schema['disableReplyMetrics']) => {
      setState(value)
      persisted.write('disableReplyMetrics', value)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('disableReplyMetrics', next => {
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

export function useDisableReplyMetrics() {
  return useContext(stateContext)
}

export function useSetDisableReplyMetrics() {
  return useContext(setContext)
}
