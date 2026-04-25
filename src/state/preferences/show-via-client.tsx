import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['showViaClient']
type SetContext = (v: persisted.Schema['showViaClient']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.showViaClient,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['showViaClient']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('showViaClient'))

  const setStateWrapped = useCallback(
    (value: persisted.Schema['showViaClient']) => {
      setState(value)
      persisted.write('showViaClient', value)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('showViaClient', next => {
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

export function useShowViaClient() {
  return useContext(stateContext)
}

export function useSetShowViaClient() {
  return useContext(setContext)
}
