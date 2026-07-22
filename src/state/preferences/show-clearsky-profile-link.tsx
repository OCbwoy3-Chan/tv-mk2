import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['showClearskyProfileLink']
type SetContext = (value: StateContext) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.showClearskyProfileLink,
)
const setContext = createContext<SetContext>((_: StateContext) => {})

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('showClearskyProfileLink'))

  const setStateWrapped = useCallback((value: StateContext) => {
    setState(value)
    void persisted.write('showClearskyProfileLink', value)
  }, [])

  useEffect(() => {
    return persisted.onUpdate('showClearskyProfileLink', next => {
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

export function useShowClearskyProfileLink() {
  return useContext(stateContext) ?? persisted.defaults.showClearskyProfileLink
}

export function useSetShowClearskyProfileLink() {
  return useContext(setContext)
}
