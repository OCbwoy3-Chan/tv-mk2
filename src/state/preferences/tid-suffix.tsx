import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['tidSuffix']
type SetContext = (v: persisted.Schema['tidSuffix']) => void

const stateContext = createContext<StateContext>(persisted.defaults.tidSuffix)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['tidSuffix']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('tidSuffix'))

  const setStateWrapped = useCallback(
    (value: persisted.Schema['tidSuffix']) => {
      setState(value)
      persisted.write('tidSuffix', value)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('tidSuffix', next => {
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

export function useTidSuffix() {
  return useContext(stateContext)
}

export function useSetTidSuffix() {
  return useContext(setContext)
}
