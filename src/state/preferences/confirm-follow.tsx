import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['confirmFollow']
type SetContext = (v: persisted.Schema['confirmFollow']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.confirmFollow,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['confirmFollow']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('confirmFollow'))

  const setStateWrapped = useCallback(
    (confirmFollow: persisted.Schema['confirmFollow']) => {
      setState(confirmFollow)
      void persisted.write('confirmFollow', confirmFollow)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('confirmFollow', nextValue => {
      setState(nextValue)
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

export function useConfirmFollow() {
  return useContext(stateContext) ?? false
}

export function useSetConfirmFollow() {
  return useContext(setContext)
}
