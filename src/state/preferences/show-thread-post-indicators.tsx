import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = boolean
type SetContext = (v: boolean) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.showThreadPostIndicators ?? true,
)
const setContext = createContext<SetContext>((_: boolean) => {})

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(
    persisted.get('showThreadPostIndicators') ??
      persisted.defaults.showThreadPostIndicators ??
      true,
  )

  const setStateWrapped = useCallback((showThreadPostIndicators: boolean) => {
    setState(showThreadPostIndicators)
    void persisted.write('showThreadPostIndicators', showThreadPostIndicators)
  }, [])

  useEffect(() => {
    return persisted.onUpdate('showThreadPostIndicators', next => {
      setState(next ?? persisted.defaults.showThreadPostIndicators ?? true)
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

export function useShowThreadPostIndicators() {
  return useContext(stateContext)
}

export function useSetShowThreadPostIndicators() {
  return useContext(setContext)
}
