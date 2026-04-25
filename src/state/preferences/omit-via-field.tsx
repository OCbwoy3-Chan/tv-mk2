import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['omitViaField']
type SetContext = (v: persisted.Schema['omitViaField']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.omitViaField,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['omitViaField']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('omitViaField'))

  const setStateWrapped = useCallback(
    (value: persisted.Schema['omitViaField']) => {
      setState(value)
      persisted.write('omitViaField', value)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('omitViaField', next => {
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

export function useOmitViaField() {
  return useContext(stateContext)
}

export function useSetOmitViaField() {
  return useContext(setContext)
}
