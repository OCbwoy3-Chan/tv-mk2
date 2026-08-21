import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['hideOwnTennaBadge']
type SetContext = (v: persisted.Schema['hideOwnTennaBadge']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.hideOwnTennaBadge,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['hideOwnTennaBadge']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('hideOwnTennaBadge'))

  const setStateWrapped = useCallback(
    (value: persisted.Schema['hideOwnTennaBadge']) => {
      setState(value)
      persisted.write('hideOwnTennaBadge', value)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('hideOwnTennaBadge', next => {
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

export function useHideOwnTennaBadge() {
  return useContext(stateContext)
}

export function useSetHideOwnTennaBadge() {
  return useContext(setContext)
}
