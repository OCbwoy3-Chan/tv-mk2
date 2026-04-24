import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['directFetchRecords']
type SetContext = (v: persisted.Schema['directFetchRecords']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.directFetchRecords,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['directFetchRecords']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('directFetchRecords'))

  const setStateWrapped = useCallback(
    (directFetchRecords: persisted.Schema['directFetchRecords']) => {
      setState(directFetchRecords)
      persisted.write('directFetchRecords', directFetchRecords)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('directFetchRecords', nextDirectFetchRecords => {
      setState(nextDirectFetchRecords)
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

export function useDirectFetchRecords() {
  return useContext(stateContext)
}

export function useSetDirectFetchRecords() {
  return useContext(setContext)
}
