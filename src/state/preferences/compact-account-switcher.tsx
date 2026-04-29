import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['useCompactAccountSwitcher']
type SetContext = (v: persisted.Schema['useCompactAccountSwitcher']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.useCompactAccountSwitcher,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['useCompactAccountSwitcher']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('useCompactAccountSwitcher'))

  const setStateWrapped = useCallback(
    (value: persisted.Schema['useCompactAccountSwitcher']) => {
      setState(value)
      persisted.write('useCompactAccountSwitcher', value)
    },
    [],
  )

  useEffect(() => {
    return persisted.onUpdate('useCompactAccountSwitcher', next => {
      setState(next)
    })
  }, [])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function useCompactAccountSwitcher() {
  return useContext(stateContext)
}

export function useSetCompactAccountSwitcher() {
  return useContext(setContext)
}
