import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

// Preference: discoverContextEnabled – when true, shows debug context for discover feed

type StateContext = persisted.Schema['discoverContextEnabled']
// Same setter signature used across other preference modules
type SetContext = (v: persisted.Schema['discoverContextEnabled']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.discoverContextEnabled,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['discoverContextEnabled']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('discoverContextEnabled'))

  const setStateWrapped = useCallback(
    (discoverContextEnabled: persisted.Schema['discoverContextEnabled']) => {
      setState(discoverContextEnabled)
      persisted.write('discoverContextEnabled', discoverContextEnabled)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate(
      'discoverContextEnabled',
      nextDiscoverContextEnabled => {
        setState(nextDiscoverContextEnabled)
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

export function useDiscoverContextEnabled() {
  return useContext(stateContext)
}

export function useSetDiscoverContextEnabled() {
  return useContext(setContext)
}
