import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['autoCompactAccountSwitcher']
type SetContext = (v: persisted.Schema['autoCompactAccountSwitcher']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.autoCompactAccountSwitcher,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['autoCompactAccountSwitcher']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(
    persisted.get('autoCompactAccountSwitcher'),
  )

  const setStateWrapped = useCallback(
    (value: persisted.Schema['autoCompactAccountSwitcher']) => {
      setState(value)
      persisted.write('autoCompactAccountSwitcher', value)
    },
    [],
  )

  useEffect(() => {
    return persisted.onUpdate('autoCompactAccountSwitcher', next => {
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

export function useAutoCompactAccountSwitcher() {
  return useContext(stateContext)
}

export function useSetAutoCompactAccountSwitcher() {
  return useContext(setContext)
}
