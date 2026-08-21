import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['hideBetaBadge']
type SetContext = (v: persisted.Schema['hideBetaBadge']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.hideBetaBadge,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['hideBetaBadge']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('hideBetaBadge'))

  const setStateWrapped = useCallback(
    (value: persisted.Schema['hideBetaBadge']) => {
      setState(value)
      persisted.write('hideBetaBadge', value)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('hideBetaBadge', next => {
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

export function useHideBetaBadge() {
  return useContext(stateContext)
}

export function useSetHideBetaBadge() {
  return useContext(setContext)
}
