import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['sixSevenCelebration']
type SetContext = (v: persisted.Schema['sixSevenCelebration']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.sixSevenCelebration,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['sixSevenCelebration']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('sixSevenCelebration'))

  const setStateWrapped = useCallback(
    (value: persisted.Schema['sixSevenCelebration']) => {
      setState(value)
      persisted.write('sixSevenCelebration', value)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('sixSevenCelebration', next => {
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

export function useSixSevenCelebration() {
  return useContext(stateContext)
}

export function useSetSixSevenCelebration() {
  return useContext(setContext)
}
