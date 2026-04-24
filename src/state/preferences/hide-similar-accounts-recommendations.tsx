import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

// Preference: hideSimilarAccountsRecomm – when true, hides similar accounts recommendations

type StateContext = persisted.Schema['hideSimilarAccountsRecomm']
// Same setter signature used across other preference modules
type SetContext = (v: persisted.Schema['hideSimilarAccountsRecomm']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.hideSimilarAccountsRecomm,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['hideSimilarAccountsRecomm']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('hideSimilarAccountsRecomm'))

  const setStateWrapped = useCallback(
    (value: persisted.Schema['hideSimilarAccountsRecomm']) => {
      setState(value)
      persisted.write('hideSimilarAccountsRecomm', value)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('hideSimilarAccountsRecomm', next => {
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

export function useHideSimilarAccountsRecomm() {
  return useContext(stateContext)
}

export function useSetHideSimilarAccountsRecomm() {
  return useContext(setContext)
}
